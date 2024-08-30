import {
  Context,
  DAL,
  InferEntityType,
  INotificationModuleService,
  InternalModuleDeclaration,
  ModulesSdkTypes,
  NotificationTypes,
} from "@medusajs/types"
import {
  EmitEvents,
  generateEntityId,
  InjectManager,
  MedusaContext,
  MedusaError,
  MedusaService,
  NotificationStatus,
  promiseAll,
} from "@medusajs/utils"
import { Notification } from "@models"
import { eventBuilders } from "@utils"
import NotificationProviderService from "./notification-provider"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  notificationService: ModulesSdkTypes.IMedusaInternalService<
    typeof Notification
  >
  notificationProviderService: NotificationProviderService
}

export default class NotificationModuleService
  extends MedusaService<{
    Notification: { dto: NotificationTypes.NotificationDTO }
  }>({ Notification })
  implements INotificationModuleService
{
  protected baseRepository_: DAL.RepositoryService
  protected readonly notificationService_: ModulesSdkTypes.IMedusaInternalService<
    typeof Notification
  >
  protected readonly notificationProviderService_: NotificationProviderService

  constructor(
    {
      baseRepository,
      notificationService,
      notificationProviderService,
    }: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    // @ts-ignore
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.notificationService_ = notificationService
    this.notificationProviderService_ = notificationProviderService
  }

  // @ts-expect-error
  createNotifications(
    data: NotificationTypes.CreateNotificationDTO[],
    sharedContext?: Context
  ): Promise<NotificationTypes.NotificationDTO[]>
  createNotifications(
    data: NotificationTypes.CreateNotificationDTO,
    sharedContext?: Context
  ): Promise<NotificationTypes.NotificationDTO>

  @InjectManager("baseRepository_")
  @EmitEvents()
  async createNotifications(
    data:
      | NotificationTypes.CreateNotificationDTO
      | NotificationTypes.CreateNotificationDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<
    NotificationTypes.NotificationDTO | NotificationTypes.NotificationDTO[]
  > {
    const normalized = Array.isArray(data) ? data : [data]

    const createdNotifications = await this.createNotifications_(
      normalized,
      sharedContext
    )

    const serialized = await this.baseRepository_.serialize<
      NotificationTypes.NotificationDTO[]
    >(createdNotifications)

    eventBuilders.createdNotification({
      data: serialized,
      sharedContext,
    })

    return Array.isArray(data) ? serialized : serialized[0]
  }

  @InjectManager("baseRepository_")
  protected async createNotifications_(
    data: NotificationTypes.CreateNotificationDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof Notification>[]> {
    if (!data.length) {
      return []
    }

    // TODO: At this point we should probably take a lock with the idempotency keys so we don't have race conditions.
    // Also, we should probably rely on Redis for this instead of the database.
    const idempotencyKeys = data
      .map((entry) => entry.idempotency_key)
      .filter(Boolean)

    let { notificationsToProcess, createdNotifications } =
      await this.baseRepository_.transaction(async (txManager) => {
        const context = {
          ...sharedContext,
          transactionManager: txManager,
        }

        const alreadySentNotifications = await this.notificationService_.list(
          {
            idempotency_key: idempotencyKeys,
          },
          { take: null },
          context
        )

        const existsMap = new Map(
          alreadySentNotifications.map((n) => [n.idempotency_key as string, n])
        )

        const notificationsToProcess = data.filter(
          (entry) =>
            !entry.idempotency_key ||
            !existsMap.has(entry.idempotency_key) ||
            (existsMap.has(entry.idempotency_key) &&
              [NotificationStatus.PENDING, NotificationStatus.FAILURE].includes(
                existsMap.get(entry.idempotency_key)!.status
              ))
        )

        const channels = notificationsToProcess.map((not) => not.channel)
        const providers =
          await this.notificationProviderService_.getProviderForChannels(
            channels
          )

        // Create the notifications to be sent to prevent concurrent actions listing the same notifications
        const normalizedNotificationsToProcess = notificationsToProcess.map(
          (entry) => {
            const provider = providers.find((provider) =>
              provider?.channels.includes(entry.channel)
            )

            return {
              provider,
              alreadyExists: !!(
                entry.idempotency_key && existsMap.has(entry.idempotency_key)
              ),
              data: {
                id: generateEntityId(undefined, "noti"),
                ...entry,
                provider_id: provider?.id,
              },
            }
          }
        )

        const createdNotifications = await this.notificationService_.create(
          normalizedNotificationsToProcess
            .filter((e) => !e.alreadyExists)
            .map((e) => e.data),
          context
        )

        return {
          notificationsToProcess: normalizedNotificationsToProcess,
          createdNotifications,
        }
      })

    const notificationToUpdate: { id: string; external_id?: string }[] = []

    try {
      await promiseAll(
        notificationsToProcess.map(async (entry) => {
          const provider = entry.provider

          if (!provider?.is_enabled) {
            entry.data.status = NotificationStatus.FAILURE
            notificationToUpdate.push(entry.data)

            const errorMessage = !provider
              ? `Could not find a notification provider for channel: ${entry.data.channel}`
              : `Notification provider ${provider.id} is not enabled. To enable it, configure it as a provider in the notification module options.`

            throw new MedusaError(MedusaError.Types.NOT_FOUND, errorMessage)
          }

          const res = await this.notificationProviderService_.send(
            provider,
            entry.data
          )

          entry.data.external_id = res.id
          entry.data.status = NotificationStatus.SUCCESS

          notificationToUpdate.push(entry.data)
        }),
        {
          aggregateErrors: true,
        }
      )
    } finally {
      createdNotifications = await this.notificationService_.update(
        notificationToUpdate,
        sharedContext
      )
    }

    return createdNotifications
  }
}
