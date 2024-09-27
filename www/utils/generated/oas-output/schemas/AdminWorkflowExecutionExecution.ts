/**
 * @schema AdminWorkflowExecutionExecution
 * type: object
 * description: The workflow execution's steps details.
 * x-schemaName: AdminWorkflowExecutionExecution
 * required:
 *   - steps
 * properties:
 *   steps:
 *     type: object
 *     description: The execution's steps. Each object key is a step ID, and the value is the object whose properties are shown below.
 *     required:
 *       - id
 *       - invoke
 *       - definition
 *       - compensate
 *       - depth
 *       - startedAt
 *     additionalProperties:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           title: id
 *           description: The step's ID.
 *         invoke:
 *           type: object
 *           description: The state of the step's invokation function.
 *           x-schemaName: WorkflowExecutionFn
 *           properties:
 *             state:
 *               type: string
 *               description: The invoke's state.
 *               enum:
 *                 - not_started
 *                 - invoking
 *                 - compensating
 *                 - done
 *                 - reverted
 *                 - failed
 *                 - dormant
 *                 - skipped
 *                 - skipped_failure
 *                 - timeout
 *             status:
 *               type: string
 *               description: The invoke's status.
 *               enum:
 *                 - idle
 *                 - ok
 *                 - waiting_response
 *                 - temp_failure
 *                 - permanent_failure
 *           required:
 *             - state
 *             - status
 *         definition:
 *           type: object
 *           description: The step's definition details.
 *           x-schemaName: WorkflowExecutionDefinition
 *           properties:
 *             async:
 *               type: boolean
 *               title: async
 *               description: The definition's async.
 *             compensateAsync:
 *               type: boolean
 *               title: compensateAsync
 *               description: The definition's compensateasync.
 *             noCompensation:
 *               type: boolean
 *               title: noCompensation
 *               description: The definition's nocompensation.
 *             continueOnPermanentFailure:
 *               type: boolean
 *               title: continueOnPermanentFailure
 *               description: The definition's continueonpermanentfailure.
 *             maxRetries:
 *               type: number
 *               title: maxRetries
 *               description: The definition's maxretries.
 *             noWait:
 *               type: boolean
 *               title: noWait
 *               description: The definition's nowait.
 *             retryInterval:
 *               type: number
 *               title: retryInterval
 *               description: The definition's retryinterval.
 *             retryIntervalAwaiting:
 *               type: number
 *               title: retryIntervalAwaiting
 *               description: The definition's retryintervalawaiting.
 *             saveResponse:
 *               type: boolean
 *               title: saveResponse
 *               description: The definition's saveresponse.
 *             timeout:
 *               type: number
 *               title: timeout
 *               description: The definition's timeout.
 *         compensate:
 *           type: object
 *           description: The state of the step's compensation function.
 *           x-schemaName: WorkflowExecutionFn
 *           properties:
 *             state:
 *               type: string
 *               description: The compensate's state.
 *               enum:
 *                 - not_started
 *                 - invoking
 *                 - compensating
 *                 - done
 *                 - reverted
 *                 - failed
 *                 - dormant
 *                 - skipped
 *                 - skipped_failure
 *                 - timeout
 *             status:
 *               type: string
 *               description: The compensate's status.
 *               enum:
 *                 - idle
 *                 - ok
 *                 - waiting_response
 *                 - temp_failure
 *                 - permanent_failure
 *           required:
 *             - state
 *             - status
 *         depth:
 *           type: number
 *           title: depth
 *           description: The step's depth in the workflow's execution.
 *         startedAt:
 *           type: number
 *           title: startedAt
 *           description: The timestamp the step started executing.
 * 
*/

