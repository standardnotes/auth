import 'reflect-metadata'
import { UserRegisteredEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import { UserRegisteredEventHandler } from './UserRegisteredEventHandler'
import { AxiosInstance } from 'axios'
import { StatisticCollectorInterface } from '../Statistic/StatisticCollectorInterface'

describe('UserRegisteredEventHandler', () => {
  let httpClient: AxiosInstance
  let statisticCollector: StatisticCollectorInterface
  const userServerRegistrationUrl = 'https://user-server/registration'
  const userServerAuthKey = 'auth-key'
  let event: UserRegisteredEvent
  let logger: Logger

  const createHandler = () => new UserRegisteredEventHandler(
    httpClient,
    statisticCollector,
    userServerRegistrationUrl,
    userServerAuthKey,
    logger
  )

  beforeEach(() => {
    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn()

    event = {} as jest.Mocked<UserRegisteredEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userUuid: '1-2-3',
      email: 'test@test.te',
    }

    statisticCollector = {} as jest.Mocked<StatisticCollectorInterface>
    statisticCollector.recordStatistic = jest.fn()

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
    logger.warn = jest.fn()
  })

  it('should send a request to the user management server about a registration', async () => {
    await createHandler().handle(event)

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://user-server/registration',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: {
        key: 'auth-key',
        user: {
          created_at: new Date(1),
          email: 'test@test.te',
        },
      },
      validateStatus: expect.any(Function),
    })

    expect(statisticCollector.recordStatistic).toHaveBeenCalledWith('user:registered', {})
  })

  it('should send a request to the user management server even if recording statistic fails', async () => {
    statisticCollector.recordStatistic = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    await createHandler().handle(event)

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://user-server/registration',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: {
        key: 'auth-key',
        user: {
          created_at: new Date(1),
          email: 'test@test.te',
        },
      },
      validateStatus: expect.any(Function),
    })

    expect(statisticCollector.recordStatistic).toHaveBeenCalledWith('user:registered', {})
  })

  it('should not send a request to the user management server about a registration if url is not defined', async () => {
    const handler = new UserRegisteredEventHandler(
      httpClient,
      statisticCollector,
      '',
      userServerAuthKey,
      logger
    )
    await handler.handle(event)

    expect(httpClient.request).not.toHaveBeenCalled()
  })
})
