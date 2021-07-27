import { RoleName } from '@standardnotes/auth'
import { AxiosInstance } from 'axios'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { User } from '../User/User'
import { WebSocketsConnectionRepositoryInterface } from './WebSocketsConnectionRepositoryInterface'
import { WebSocketServiceInterface } from './WebSocketsServiceInterface'

@injectable()
export class WebSocketsService implements WebSocketServiceInterface {
  constructor(
    @inject(TYPES.WebSocketsConnectionRepository) private webSocketsConnectionRepository: WebSocketsConnectionRepositoryInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.HTTPClient) private httpClient: AxiosInstance,
    @inject(TYPES.WEBSOCKETS_API_URL) private webSocketsApiUrl: string,
  ) {}

  async sendUserRoleChangedEvent(
    user: User,
    fromRole: RoleName,
    toRole: RoleName,
  ): Promise<void> {
    const userConnections =
      await this.webSocketsConnectionRepository.findAllByUserUuid(user.uuid)
    
    const event = this.domainEventFactory.createUserRoleChangedEvent(
      user.uuid,
      user.email,
      fromRole,
      toRole
    )

    await Promise.all(
      userConnections.map(async (connectionUuid) => {
        await this.httpClient.request({
          method: 'POST',
          url: `${this.webSocketsApiUrl}/${connectionUuid}`,
          headers: {
            Accept: 'text/plain',
            'Content-Type': 'text/plain',
          },
          data: JSON.stringify(event),
          validateStatus:
            /* istanbul ignore next */
            (status: number) => status >= 200 && status < 500,
        })
      })
    )
  }
}