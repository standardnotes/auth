import 'reflect-metadata'

import { UserRoleChangedEvent } from '@standardnotes/domain-events'
import { User } from '../../Domain/User/User'
import { RoleName } from '@standardnotes/auth'

import { WebSocketsClientService } from './WebSocketsClientService'
import { WebSocketsConnectionRepositoryInterface } from '../../Domain/WebSockets/WebSocketsConnectionRepositoryInterface'
import { DomainEventFactoryInterface } from '../../Domain/Event/DomainEventFactoryInterface'
import { AxiosInstance } from 'axios'
import { Logger } from 'winston'

describe('WebSocketsClientService', () => {
  let connectionIds: string[]
  let user: User
  let roleName: RoleName
  let event: UserRoleChangedEvent
  let webSocketsConnectionRepository: WebSocketsConnectionRepositoryInterface
  let domainEventFactory: DomainEventFactoryInterface
  let httpClient: AxiosInstance
  let logger: Logger

  let webSocketsApiUrl = 'http://test-websockets'

  const createService = () => new WebSocketsClientService(
    webSocketsConnectionRepository,
    domainEventFactory,
    httpClient,
    webSocketsApiUrl,
    logger
  )

  beforeEach(() => {
    connectionIds = ['1', '2']

    user = {
      uuid: '123',
      email: 'test@test.com',
    } as jest.Mocked<User>

    roleName = RoleName.ProUser

    event = {} as jest.Mocked<UserRoleChangedEvent>

    webSocketsConnectionRepository = {} as jest.Mocked<WebSocketsConnectionRepositoryInterface>
    webSocketsConnectionRepository.findAllByUserUuid = jest.fn().mockReturnValue(connectionIds)

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createUserRoleChangedEvent = jest.fn().mockReturnValue(event)

    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn()

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should send a user role changed event to all user connections', async () => {
    await createService().sendUserRoleChangedEvent(user, roleName)

    expect(httpClient.request).toHaveBeenCalledTimes(connectionIds.length)
    connectionIds.map((id, index) => {
      expect(httpClient.request).toHaveBeenNthCalledWith(index + 1, expect.objectContaining({
        method: 'POST',
        url: `${webSocketsApiUrl}/${id}`,
        data: JSON.stringify(event),
      }))
    })
  })

  it('should not send a user role changed event if web sockets api url not defined', async () => {
    webSocketsApiUrl = ''

    await createService().sendUserRoleChangedEvent(user, roleName)

    expect(httpClient.request).not.toHaveBeenCalled()
  })
})
