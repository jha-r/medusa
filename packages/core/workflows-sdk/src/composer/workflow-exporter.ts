import { MedusaModule } from "@medusajs/modules-sdk"
import {
  DistributedTransactionEvents,
  DistributedTransactionType,
  LocalWorkflow,
  TransactionHandlerType,
  TransactionState,
} from "@medusajs/orchestration"
import {
  Context,
  IEventBusModuleService,
  LoadedModule,
  Logger,
  MedusaContainer,
} from "@medusajs/types"
import {
  ContainerRegistrationKeys,
  isPresent,
  MedusaContextType,
  Modules,
} from "@medusajs/utils"
import { EOL } from "os"
import { ulid } from "ulid"
import {
  FlowCancelOptions,
  FlowRegisterStepFailureOptions,
  FlowRegisterStepSuccessOptions,
  FlowRunOptions,
  WorkflowResult,
} from "../helper"
import { resolveValue } from "./helpers"

export type LocalWorkflowExecutionOptions = {
  defaultResult?: string | Symbol
  options?: {
    wrappedInput?: boolean
    sourcePath?: string
  }
}

export class WorkflowExporter<TData = unknown, TResult = unknown> {
  readonly #localWorkflow: LocalWorkflow
  readonly #localWorkflowExecutionOptions: LocalWorkflowExecutionOptions
  #executionWrapper: {
    run: LocalWorkflow["run"]
    registerStepSuccess: LocalWorkflow["registerStepSuccess"]
    registerStepFailure: LocalWorkflow["registerStepFailure"]
    cancel: LocalWorkflow["cancel"]
  }

  constructor({
    workflowId,
    options,
  }: {
    workflowId: string
    options: LocalWorkflowExecutionOptions
  }) {
    this.#localWorkflow = new LocalWorkflow(workflowId)
    this.#localWorkflowExecutionOptions = options
    this.#executionWrapper = {
      run: this.#localWorkflow.run.bind(this.#localWorkflow),
      registerStepSuccess: this.#localWorkflow.registerStepSuccess.bind(
        this.#localWorkflow
      ),
      registerStepFailure: this.#localWorkflow.registerStepFailure.bind(
        this.#localWorkflow
      ),
      cancel: this.#localWorkflow.cancel.bind(this.#localWorkflow),
    }
  }

  async #executeAction(
    method: Function,
    {
      throwOnError,
      logOnError = false,
      resultFrom,
      isCancel = false,
      container,
    },
    transactionOrIdOrIdempotencyKey: DistributedTransactionType | string,
    input: unknown,
    context: Context,
    events: DistributedTransactionEvents | undefined = {}
  ) {
    const flow = this.#localWorkflow

    let container_: MedusaContainer | LoadedModule[] | undefined = container

    if (!container_) {
      if (
        !container_ ||
        !isPresent((flow.container as MedusaContainer)?.registrations)
      ) {
        container_ = MedusaModule.getLoadedModules().map(
          (mod) => Object.values(mod)[0]
        )
      }
    }

    if (container_) {
      flow.container = container_
    }

    const { eventGroupId, parentStepIdempotencyKey } = context

    this.#attachOnFinishReleaseEvents(events, flow, { logOnError })

    const flowMetadata = {
      eventGroupId,
      parentStepIdempotencyKey,
      sourcePath: this.#localWorkflowExecutionOptions.options?.sourcePath,
    }

    const args = [
      transactionOrIdOrIdempotencyKey,
      input,
      context,
      events,
      flowMetadata,
    ]
    const transaction = (await method.apply(
      method,
      args
    )) as DistributedTransactionType

    let errors = transaction.getErrors(TransactionHandlerType.INVOKE)

    const failedStatus = [TransactionState.FAILED, TransactionState.REVERTED]
    const isCancelled =
      isCancel && transaction.getState() === TransactionState.REVERTED

    const isRegisterStepFailure =
      method === this.#executionWrapper.registerStepFailure &&
      transaction.getState() === TransactionState.REVERTED

    let thrownError = null

    if (
      failedStatus.includes(transaction.getState()) &&
      !isCancelled &&
      !isRegisterStepFailure
    ) {
      const firstError = errors?.[0]?.error ?? new Error("Unknown error")
      thrownError = firstError

      if (throwOnError) {
        throw firstError
      }
    }

    let result
    if (this.#localWorkflowExecutionOptions.options?.wrappedInput) {
      result = resolveValue(resultFrom, transaction.getContext())
      if (result instanceof Promise) {
        result = await result.catch((e) => {
          thrownError = e

          if (throwOnError) {
            throw e
          }

          errors ??= []
          errors.push(e)
        })
      }
    } else {
      result = transaction.getContext().invoke?.[resultFrom]
    }

    return {
      errors,
      transaction,
      result,
      thrownError,
    }
  }

  #attachOnFinishReleaseEvents(
    events: DistributedTransactionEvents = {},
    flow: LocalWorkflow,
    {
      logOnError,
    }: {
      logOnError?: boolean
    } = {}
  ) {
    const onFinish = events.onFinish

    const wrappedOnFinish = async (args: {
      transaction: DistributedTransactionType
      result?: unknown
      errors?: unknown[]
    }) => {
      const { transaction } = args
      const flowEventGroupId = transaction.getFlow().metadata?.eventGroupId

      const logger =
        (flow.container as MedusaContainer).resolve<Logger>(
          ContainerRegistrationKeys.LOGGER,
          { allowUnregistered: true }
        ) || console

      if (logOnError) {
        const TERMINAL_SIZE = process.stdout?.columns ?? 60
        const separator = new Array(TERMINAL_SIZE).join("-")

        const workflowName = transaction.getFlow().modelId
        const allWorkflowErrors = transaction
          .getErrors()
          .map(
            (err) =>
              `${workflowName}:${err?.action}:${err?.handlerType} - ${err?.error?.message}${EOL}${err?.error?.stack}`
          )
          .join(EOL + separator + EOL)

        if (allWorkflowErrors) {
          logger.error(allWorkflowErrors)
        }
      }

      await onFinish?.(args)

      const eventBusService = (
        flow.container as MedusaContainer
      ).resolve<IEventBusModuleService>(Modules.EVENT_BUS, {
        allowUnregistered: true,
      })

      if (!eventBusService || !flowEventGroupId) {
        return
      }

      const failedStatus = [TransactionState.FAILED, TransactionState.REVERTED]

      if (failedStatus.includes(transaction.getState())) {
        return await eventBusService
          .clearGroupedEvents(flowEventGroupId)
          .catch(() => {
            logger.warn(
              `Failed to clear events for eventGroupId - ${flowEventGroupId}`
            )
          })
      }

      await eventBusService
        .releaseGroupedEvents(flowEventGroupId)
        .catch((e) => {
          logger.error(
            `Failed to release grouped events for eventGroupId: ${flowEventGroupId}`,
            e
          )

          return flow.cancel(transaction)
        })
    }

    events.onFinish = wrappedOnFinish
  }

  async run<TDataOverride = undefined, TResultOverride = undefined>({
    input,
    context: outerContext,
    throwOnError,
    logOnError,
    resultFrom,
    events,
    container,
  }: FlowRunOptions<
    TDataOverride extends undefined ? TData : TDataOverride
  > = {}): Promise<
    WorkflowResult<
      TResultOverride extends undefined ? TResult : TResultOverride
    >
  > {
    const { defaultResult } = this.#localWorkflowExecutionOptions

    const resultFrom_ = resultFrom ?? defaultResult
    const throwOnError_ = throwOnError ?? true
    const logOnError_ = logOnError ?? false

    const context = {
      ...outerContext,
      __type: MedusaContextType as Context["__type"],
    }

    context.transactionId ??= ulid()
    context.eventGroupId ??= ulid()

    let input_ = input
    return await this.#executeAction(
      this.#executionWrapper.run,
      {
        throwOnError: throwOnError_,
        resultFrom: resultFrom_,
        logOnError: logOnError_,
        container,
      },
      context.transactionId,
      input_,
      context,
      events
    )
  }

  async registerStepSuccess(
    {
      response,
      idempotencyKey,
      context: outerContext,
      throwOnError,
      logOnError,
      resultFrom,
      events,
      container,
    }: FlowRegisterStepSuccessOptions = {
      idempotencyKey: "",
    }
  ) {
    const { defaultResult } = this.#localWorkflowExecutionOptions

    const idempotencyKey_ = idempotencyKey ?? ""
    const resultFrom_ = resultFrom ?? defaultResult
    const throwOnError_ = throwOnError ?? true
    const logOnError_ = logOnError ?? false

    const [, transactionId] = idempotencyKey_.split(":")
    const context = {
      ...outerContext,
      transactionId,
      __type: MedusaContextType as Context["__type"],
    }

    context.eventGroupId ??= ulid()

    return await this.#executeAction(
      this.#executionWrapper.registerStepSuccess,
      {
        throwOnError: throwOnError_,
        resultFrom: resultFrom_,
        logOnError: logOnError_,
        container,
      },
      idempotencyKey_,
      response,
      context,
      events
    )
  }

  async registerStepFailure(
    {
      response,
      idempotencyKey,
      context: outerContext,
      throwOnError,
      logOnError,
      resultFrom,
      events,
      container,
    }: FlowRegisterStepFailureOptions = {
      idempotencyKey: "",
    }
  ) {
    const { defaultResult } = this.#localWorkflowExecutionOptions

    const idempotencyKey_ = idempotencyKey ?? ""
    const resultFrom_ = resultFrom ?? defaultResult
    const throwOnError_ = throwOnError ?? true
    const logOnError_ = logOnError ?? false

    const [, transactionId] = idempotencyKey_.split(":")
    const context = {
      ...outerContext,
      transactionId,
      __type: MedusaContextType as Context["__type"],
    }

    context.eventGroupId ??= ulid()

    return await this.#executeAction(
      this.#executionWrapper.registerStepFailure,
      {
        throwOnError: throwOnError_,
        resultFrom: resultFrom_,
        logOnError: logOnError_,
        container,
      },
      idempotencyKey,
      response,
      context,
      events
    )
  }

  async cancel({
    transaction,
    transactionId,
    context: outerContext,
    throwOnError,
    logOnError,
    events,
    container,
  }: FlowCancelOptions = {}) {
    const throwOnError_ = throwOnError ?? true
    const logOnError_ = logOnError ?? false

    const context = {
      ...outerContext,
      transactionId,
      __type: MedusaContextType as Context["__type"],
    }

    context.eventGroupId ??= ulid()

    return await this.#executeAction(
      this.#executionWrapper.cancel,
      {
        throwOnError: throwOnError_,
        resultFrom: undefined,
        isCancel: true,
        logOnError: logOnError_,
        container,
      },
      transaction ?? transactionId!,
      undefined,
      context,
      events
    )
  }
}
