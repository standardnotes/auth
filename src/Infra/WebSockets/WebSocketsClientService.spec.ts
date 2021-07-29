import 'reflect-metadata'

import { UserRoleChangedEvent } from '@standardnotes/domain-events'
import { User } from '../../Domain/User/User'
import { RoleName } from '@standardnotes/auth'

import { WebSocketsClientService } from './WebSocketsClientService'
import { WebSocketsConnectionRepositoryInterface } from '../../Domain/WebSockets/WebSocketsConnectionRepositoryInterface'
import { DomainEventFactoryInterface } from '../../Domain/Event/DomainEventFactoryInterface'
import { AxiosInstance } from 'axios'

describe('WebSocketsClientService', () => {
  let connectionIds: string[]
  let user: User
  let fromRole: RoleName
  let toRole: RoleName
  let event: UserRoleChangedEvent
  let webSocketsConnectionRepository: WebSocketsConnectionRepositoryInterface
  let domainEventFactory: DomainEventFactoryInterface
  let httpClient: AxiosInstance
  
  const webSocketsApiUrl = 'http://test-websockets'

  const createService = () => new WebSocketsClientService(
    webSocketsConnectionRepository,
    domainEventFactory,
    httpClient,
    webSocketsApiUrl,
  )

  beforeEach(() => {
    connectionIds = ['1', '2']

    user = {
      uuid: '123',
      email: 'test@test.com',
    } as jest.Mocked<User>

    fromRole = RoleName.CoreUser
    toRole = RoleName.ProUser

    event = {} as jest.Mocked<UserRoleChangedEvent>

    webSocketsConnectionRepository = {} as jest.Mocked<WebSocketsConnectionRepositoryInterface>
    webSocketsConnectionRepository.findAllByUserUuid = jest.fn().mockReturnValue(connectionIds)

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createUserRoleChangedEvent = jest.fn().mockReturnValue(event)

    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn()
  })

  describe('send user role changed event', () => {
    it('should send a user role changed event to all user connections', async () => {
      await createService().sendUserRoleChangedEvent(user, fromRole, toRole)

      expect(httpClient.request).toHaveBeenCalledTimes(connectionIds.length)
      connectionIds.map((id, index) => {
        expect(httpClient.request).toHaveBeenNthCalledWith(index + 1, expect.objectContaining({
          method: 'POST',
          url: `${webSocketsApiUrl}/${id}`,
          data: JSON.stringify(event),
        }))
      })
    })
  })
})
