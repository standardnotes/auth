import { AxiosInstance } from 'axios'
import 'reflect-metadata'


import { Logger } from 'winston'
import { PaymentsSubscriptionHttpService } from './PaymentsSubscriptionHttpService'

describe('PaymentsSubscriptionHttpService', () => {
  let httpClient: AxiosInstance
  let logger: Logger

  const paymentsServerUrl = 'https://payments-server'

  const createService = () => new PaymentsSubscriptionHttpService(httpClient, paymentsServerUrl, logger)

  beforeEach(() => {
    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn().mockReturnValue({ data: { foo: 'bar' } })

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should send a request to payments service in order to get user subscription data', async () => {
    httpClient.request = jest.fn().mockReturnValue({
      data: {
        subscriptions: [
          {
            canceled: false,
          },
        ],
      },
    })

    await createService().getUserSubscription('1-2-3')

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      url: 'https://payments-server/internal/users/1-2-3/subscriptions',
      validateStatus: expect.any(Function),
    })
  })

  it('should throw error when getting user subscription data if the response is malformed', async () => {
    httpClient.request = jest.fn().mockReturnValue({
      data: {},
    })

    let error = null
    try {
      await createService().getUserSubscription('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should skip getting user subscription data if the payments url is not defined', async () => {
    const service = new PaymentsSubscriptionHttpService(httpClient, '', logger)

    await service.getUserSubscription('1-2-3')

    expect(httpClient.request).not.toHaveBeenCalled()
  })
})
