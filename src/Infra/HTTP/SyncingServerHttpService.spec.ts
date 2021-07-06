import { AxiosInstance } from 'axios'
import 'reflect-metadata'

import { SyncingServerHttpService } from './SyncingServerHttpService'

describe('SyncingServerHttpService', () => {
  let httpClient: AxiosInstance
  const authServerUrl = 'https://syncing-server'

  const createService = () => new SyncingServerHttpService(httpClient, authServerUrl)

  beforeEach(() => {
    httpClient = {} as jest.Mocked<AxiosInstance>
    httpClient.request = jest.fn().mockReturnValue({ status: 200, data: { secret: 'foo', extensionUuid: '1-2-3' } })
  })

  it('should send a request to syncing service in order to get mfa secret for user', async () => {
    expect(await createService().getUserMFASecret('1-2-3')).toEqual({ secret: 'foo', extensionUuid: '1-2-3' })

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://syncing-server/items/mfa/1-2-3',
      headers: {
        'Accept': 'application/json',
      },
      validateStatus: expect.any(Function),
    })
  })

  it('should return undefined if mfa secret is not found for user', async () => {
    httpClient.request = jest.fn().mockReturnValue({ status: 404 })

    expect(await createService().getUserMFASecret('1-2-3')).toEqual(undefined)

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://syncing-server/items/mfa/1-2-3',
      headers: {
        'Accept': 'application/json',
      },
      validateStatus: expect.any(Function),
    })
  })
})
