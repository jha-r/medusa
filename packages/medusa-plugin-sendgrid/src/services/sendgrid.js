import { BaseService } from "medusa-interfaces"
import SendGrid from "@sendgrid/mail"

class SendGridService extends BaseService {
  /**
   * @param {Object} options - options defined in `medusa-config.js`
   *    e.g.
   *    {
   *      api_key: SendGrid api key
   *      from: Medusa <hello@medusa.example>,
   *      order_placed_template: 01234,
   *      order_updated_template: 56789,
   *      order_updated_cancellede: 4242,
   *      user_password_reset: 0000,
   *      customer_password_reset: 1111,
   *    }
   */
  constructor(options) {
    super()

    this.options_ = options

    SendGrid.setApiKey(options.api_key)
  }

  /**
   * Sends a transactional email based on an event using SendGrid.
   * @param {string} event - event related to the order
   * @param {Object} order - the order object sent to SendGrid, that must
   *    correlate with the structure specificed in the dynamic template
   * @returns {Promise} result of the send operation
   */
  async transactionalEmail(event, order) {
    let templateId
    switch (event) {
      case "order.placed":
        templateId = this.options_.order_placed_template
        break
      case "order.updated":
        templateId = this.options_.order_updated_template
        break
      case "order.cancelled":
        templateId = this.options_.order_cancelled_template
        break
      case "user.password_reset":
        templateId = this.options_.user_password_reset
        break
      case "customer.password_reset":
        templateId = this.options_.customer_password_reset
        break
      default:
        return
    }

    try {
      return SendGrid.send({
        template_id: templateId,
        from: options.from,
        to: order.email,
        dynamic_template_data: order,
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Sends an email using SendGrid.
   * @param {string} templateId - id of template in SendGrid
   * @param {string} from - sender of email
   * @param {string} to - receiver of email
   * @param {Object} data - data to send in mail (match with template)
   * @returns {Promise} result of the send operation
   */
  async sendEmail(templateId, from, to, data) {
    try {
      return SendGrid.send({
        to,
        from,
        template_id: templateId,
        dynamic_template_data: data,
      })
    } catch (error) {
      throw error
    }
  }
}

export default SendGridService
