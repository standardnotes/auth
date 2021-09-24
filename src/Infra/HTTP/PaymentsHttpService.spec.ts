import { AxiosInstance } from 'axios'
import 'reflect-metadata'


import { Logger } from 'winston'
import { PaymentsHttpService } from './PaymentsHttpService'

describe('PaymentsHttpService', () => {
  let httpClient: AxiosInstance
  let logger: Logger

  const paymentsServerUrl = 'https://payments-server'

  const createService = () => new PaymentsHttpService(httpClient, paymentsServerUrl, logger)

  beforeEach(() => {
    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn().mockReturnValue({ data: { foo: 'bar' } })

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should send a request to payments service in order to get user subscription data', async () => {
    httpClient.request = jest.fn().mockReturnValue({
      data: {
        user: {
          subscription: {
            canceled: false,
          },
        },
      },
    })

    await createService().getUser('a-b-c')

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      url: 'https://payments-server/internal/users/a-b-c',
      validateStatus: expect.any(Function),
    })
  })

  it('should throw error when getting user subscription data if the response is malformed', async () => {
    httpClient.request = jest.fn().mockReturnValue({
      data: {},
    })

    let error = null
    try {
      await createService().getUser('a-b-c')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should throw error when getting user subscription data if the response contains a user without a subscription', async () => {
    httpClient.request = jest.fn().mockReturnValue({
      data: {
        user: {
          email: 'test@test.te',
        },
      },
    })

    let error = null
    try {
      await createService().getUser('a-b-c')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should skip getting user subscription data if the payments url is not defined', async () => {
    const service = new PaymentsHttpService(httpClient, '', logger)

    await service.getUser('a-b-c')

    expect(httpClient.request).not.toHaveBeenCalled()
  })
})
