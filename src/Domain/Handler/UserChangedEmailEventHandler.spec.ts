import 'reflect-metadata'

import { UserChangedEmailEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'
import { AxiosInstance } from 'axios'

import { UserChangedEmailEventHandler } from './UserChangedEmailEventHandler'

describe('UserChangedEmailEventHandler', () => {
  let httpClient: AxiosInstance
  const userServerChangeEmailUrl = 'https://user-server/change-email'
  const userServerAuthKey = 'auth-key'
  let event: UserChangedEmailEvent
  let logger: Logger

  const createHandler = () => new UserChangedEmailEventHandler(
    httpClient,
    userServerChangeEmailUrl,
    userServerAuthKey,
    logger
  )

  beforeEach(() => {
    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn()

    event = {} as jest.Mocked<UserChangedEmailEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userUuid: '1-2-3',
      fromEmail: 'test@test.te',
      toEmail: 'test2@test.te',
    }

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should send a request to the user management server about an email change', async () => {
    await createHandler().handle(event)

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://user-server/change-email',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: {
        key: 'auth-key',
        user: {
          uuid: '1-2-3',
          from_email: 'test@test.te',
          to_email: 'test2@test.te',
        },
      },
      validateStatus: expect.any(Function),
    })
  })

  it('should not send a request to the user management server about an email change if url is not defined', async () => {
    const handler = new UserChangedEmailEventHandler(
      httpClient,
      '',
      userServerAuthKey,
      logger
    )
    await handler.handle(event)

    expect(httpClient.request).not.toHaveBeenCalled()
  })
})
