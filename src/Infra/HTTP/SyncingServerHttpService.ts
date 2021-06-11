import { inject, injectable } from 'inversify'
import { SuperAgentStatic } from 'superagent'
import TYPES from '../../Bootstrap/Types'
import { ItemHttpServiceInterface } from '../../Domain/Item/ItemHttpServiceInterface'

@injectable()
export class SyncingServerHttpService implements ItemHttpServiceInterface {
  constructor (
    @inject(TYPES.HTTPClient) private httpClient: SuperAgentStatic,
    @inject(TYPES.SYNCING_SERVER_URL) private syncingServerUrl: string,
  ) {
  }

  async getUserMFASecret(userUuid: string): Promise<{ secret: string, extensionUuid: string } | undefined> {
    const mfaSecretResponse = await this.httpClient
      .get(`${this.syncingServerUrl}/items/mfa/${userUuid}`)
      .ok(
        /* istanbul ignore next */
        response => response.status < 500
      )
      .send()

    if(mfaSecretResponse.status === 404) {
      return undefined
    }

    return mfaSecretResponse.body
  }
}
