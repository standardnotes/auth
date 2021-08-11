import 'reflect-metadata'

import { UserRolesChangedEvent } from '@standardnotes/domain-events'
import { User } from '../../Domain/User/User'
import { RoleName } from '@standardnotes/auth'

import { WebSocketsClientService } from './WebSocketsClientService'
import { WebSocketsConnectionRepositoryInterface } from '../../Domain/WebSockets/WebSocketsConnectionRepositoryInterface'
import { DomainEventFactoryInterface } from '../../Domain/Event/DomainEventFactoryInterface'
import { AxiosInstance } from 'axios'

describe('WebSocketsClientService', () => {
  let connectionIds: string[]
  let user: User
  let event: UserRolesChangedEvent
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
      roles: Promise.resolve([
        {
          name: RoleName.ProUser,
        },
      ]),
    } as jest.Mocked<User>


    event = {} as jest.Mocked<UserRolesChangedEvent>

    webSocketsConnectionRepository = {} as jest.Mocked<WebSocketsConnectionRepositoryInterface>
    webSocketsConnectionRepository.findAllByUserUuid = jest.fn().mockReturnValue(connectionIds)

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createUserRolesChangedEvent = jest.fn().mockReturnValue(event)

    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn()
  })

  describe('send user role changed event', () => {
    it('should send a user role changed event to all user connections', async () => {
      await createService().sendUserRolesChangedEvent(user)

      expect(domainEventFactory.createUserRolesChangedEvent).toHaveBeenCalledWith(
        '123',
        'test@test.com',
        [
          RoleName.ProUser,
        ]
      )
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
