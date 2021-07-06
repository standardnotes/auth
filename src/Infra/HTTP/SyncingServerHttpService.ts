import { AxiosInstance } from 'axios'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { ItemHttpServiceInterface } from '../../Domain/Item/ItemHttpServiceInterface'

@injectable()
export class SyncingServerHttpService implements ItemHttpServiceInterface {
  constructor (
    @inject(TYPES.HTTPClient) private httpClient: AxiosInstance,
    @inject(TYPES.SYNCING_SERVER_URL) private syncingServerUrl: string,
  ) {
  }

  async getUserMFASecret(userUuid: string): Promise<{ secret: string, extensionUuid: string } | undefined> {
    const mfaSecretResponse = await this.httpClient
      .request({
        method: 'GET',
        url: `${this.syncingServerUrl}/items/mfa/${userUuid}`,
        headers: {
          'Accept': 'application/json',
        },
        validateStatus:
          /* istanbul ignore next */
          (status: number) => status >= 200 && status < 500,
      })

    if(mfaSecretResponse.status === 404) {
      return undefined
    }

    return mfaSecretResponse.data
  }
}
