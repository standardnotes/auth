import 'reflect-metadata'

import { Response, SuperAgentRequest, SuperAgentStatic } from 'superagent'
import { SyncingServerHttpService } from './SyncingServerHttpService'

describe('SyncingServerHttpService', () => {
  let httpClient: SuperAgentStatic
  let request: SuperAgentRequest
  let response: Response
  const authServerUrl = 'https://syncing-server'

  const createService = () => new SyncingServerHttpService(httpClient, authServerUrl)

  beforeEach(() => {
    response = {} as jest.Mocked<Response>
    response.status = 200
    response.body = {
      secret: 'foo',
      extensionUuid: '1-2-3',
    }

    request = {} as jest.Mocked<SuperAgentRequest>
    request.query = jest.fn().mockReturnThis()
    request.ok = jest.fn().mockReturnThis()
    request.send = jest.fn().mockReturnValue(response)

    httpClient = {} as jest.Mocked<SuperAgentStatic>
    httpClient.get = jest.fn().mockReturnValue(request)
  })

  it('should send a request to syncing service in order to get mfa secret for user', async () => {
    expect(await createService().getUserMFASecret('1-2-3')).toEqual({ secret: 'foo', extensionUuid: '1-2-3' })

    expect(httpClient.get).toHaveBeenCalledWith('https://syncing-server/items/mfa/1-2-3')
    expect(request.send).toHaveBeenCalled()
  })

  it('should return undefined if mfa secret is not found for user', async () => {
    response.status = 404
    request.send = jest.fn().mockReturnValue(response)

    expect(await createService().getUserMFASecret('1-2-3')).toEqual(undefined)

    expect(httpClient.get).toHaveBeenCalledWith('https://syncing-server/items/mfa/1-2-3')
    expect(request.send).toHaveBeenCalled()
  })
})
