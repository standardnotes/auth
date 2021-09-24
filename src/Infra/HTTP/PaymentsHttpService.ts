import { AxiosInstance } from 'axios'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { PaymentsHttpServiceInterface } from '../../Domain/Subscription/PaymentsHttpServiceInterface'

@injectable()
export class PaymentsHttpService implements PaymentsHttpServiceInterface {
  constructor (
    @inject(TYPES.HTTPClient) private httpClient: AxiosInstance,
    @inject(TYPES.PAYMENTS_SERVER_URL) private paymentsServerUrl: string,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async getUser(extensionKey: string): Promise<
    {
      id: string,
      extension_server_key: string,
      email: string,
      subscription: {
        canceled: boolean,
        created_at: string,
        updated_at: string,
        active_until: string,
      },
    } |
    undefined
  >
  {
    if (!this.paymentsServerUrl) {
      this.logger.debug('Payments server url not defined. Skipped fetching subscription.')

      return undefined
    }

    const response = await this.httpClient.request({
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      url: `${this.paymentsServerUrl}/internal/users/${extensionKey}`,
      validateStatus:
        /* istanbul ignore next */
        (status: number) => status >= 200 && status < 500,
    })

    if (!response.data.user || !response.data.user.subscription) {
      throw new Error('Missing user subscriptions from auth service response')
    }

    return response.data.user
  }
}
