import { AxiosInstance } from 'axios'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { PaymentsSubscriptionHttpServiceInterface } from '../../Domain/Subscription/PaymentsSubscriptionHttpServiceInterface'

@injectable()
export class PaymentsSubscriptionHttpService implements PaymentsSubscriptionHttpServiceInterface {
  constructor (
    @inject(TYPES.HTTPClient) private httpClient: AxiosInstance,
    @inject(TYPES.PAYMENTS_SERVER_URL) private paymentsServerUrl: string,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async getUserSubscription(userUuid: string): Promise<{ active_until: string, canceled: boolean, created_at: string, updated_at: string } | undefined> {
    if (!this.paymentsServerUrl) {
      this.logger.debug('Payments server url not defined. Skipped fetching subscription.')

      return undefined
    }

    const response = await this.httpClient.request({
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      url: `${this.paymentsServerUrl}/internal/users/${userUuid}/subscriptions`,
      validateStatus:
        /* istanbul ignore next */
        (status: number) => status >= 200 && status < 500,
    })

    if (!response.data.subscriptions) {
      throw new Error('Missing user subscriptions from auth service response')
    }

    return response.data.subscriptions[0]
  }
}
