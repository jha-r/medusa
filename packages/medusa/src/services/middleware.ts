import { RequestHandler, Router } from "express"
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { TransactionBaseService } from "../interfaces"

type middlewareType = {
  middleware: (options: Record<string, unknown>) => RequestHandler
  options: Record<string, unknown>
}

/**
 * Orchestrates dynamic middleware registered through the Medusa Middleware API
 */
class MiddlewareService extends TransactionBaseService<MiddlewareService> {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager | undefined

  protected readonly postAuthentication_: middlewareType[]
  protected readonly preAuthentication_: middlewareType[]
  protected readonly preCartCreation_: RequestHandler[]
  protected readonly routers: Record<string, Router[]>

  constructor({ manager }) {
    // eslint-disable-next-line prefer-rest-params
    super(arguments[0])
    this.manager_ = manager

    this.postAuthentication_ = []
    this.preAuthentication_ = []
    this.preCartCreation_ = []
    this.routers = {}
  }

  addRouter(path: string, router: Router): void {
    const existing = this.routers[path] || []
    this.routers[path] = [...existing, router]
  }

  getRouters(path: string): Router[] {
    const routers = this.routers[path] || []
    return routers
  }

  /**
   * Validates a middleware function, throws if fn is not of type function.
   * @param {function} fn - the middleware function to validate.
   * @returns nothing if the middleware is a function
   */
  validateMiddleware_(fn): void {
    if (typeof fn !== "function") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Middleware must be a function"
      )
    }
  }

  /**
   * Adds a middleware function to be called after authentication is completed.
   * @param {function} middleware - the middleware function. Should return a
   *   middleware function.
   * @param {object} options - the arguments that will be passed to the
   *   middleware
   * @return void
   */
  addPostAuthentication(
    middleware: (options: Record<string, unknown>) => RequestHandler,
    options: Record<string, unknown>
  ): void {
    this.validateMiddleware_(middleware)
    this.postAuthentication_.push({
      middleware,
      options: options || {},
    })
  }

  /**
   * Adds a middleware function to be called before authentication is completed.
   * @param {function} middleware - the middleware function. Should return a
   *   middleware function.
   * @param {object} options - the arguments that will be passed to the
   *   middleware
   * @return void
   */
  addPreAuthentication(
    middleware: (options: Record<string, unknown>) => RequestHandler,
    options: Record<string, unknown>
  ): void {
    this.validateMiddleware_(middleware)
    this.preAuthentication_.push({
      middleware,
      options: options || {},
    })
  }

  /**
   * Adds a middleware function to be called before cart creation
   * @param {function} middleware - the middleware function. Should return a
   *   middleware function.
   * @return {void}
   */
  addPreCartCreation(middleware: RequestHandler): void {
    this.validateMiddleware_(middleware)
    this.preCartCreation_.push(middleware)
  }

  /**
   * Adds post authentication middleware to an express app.
   * @param {ExpressApp} app - the express app to add the middleware to
   * @return {void}
   */
  usePostAuthentication(app: Router): void {
    for (const object of this.postAuthentication_) {
      app.use(object.middleware(object.options))
    }
  }

  /**
   * Adds pre authentication middleware to an express app.
   * @param {ExpressApp} app - the express app to add the middleware to
   * @return {void}
   */
  usePreAuthentication(app: Router): void {
    for (const object of this.preAuthentication_) {
      app.use(object.middleware(object.options))
    }
  }

  usePreCartCreation(): RequestHandler[] {
    return this.preCartCreation_
  }
}

export default MiddlewareService
