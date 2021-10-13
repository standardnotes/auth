import 'reflect-metadata'

import * as express from 'express'

import { OfflineController } from './OfflineController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'

describe('OfflineController', () => {
  let getUserFeatures: GetUserFeatures

  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new OfflineController(
    getUserFeatures,
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    user.uuid = '123'

    getUserFeatures = {} as jest.Mocked<GetUserFeatures>
    getUserFeatures.execute = jest.fn()

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>

    response = {
      locals: {},
    } as jest.Mocked<express.Response>
  })

  it('should get offline user features', async () => {
    response.locals.offlineUserEmail = 'test@test.com'
    response.locals.offlineFeaturesToken = 'features-token'

    getUserFeatures.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().getOfflineFeatures(request, response)
    const result = await httpResponse.executeAsync()

    expect(getUserFeatures.execute).toHaveBeenCalledWith({
      email: 'test@test.com',
      offline: true,
      offlineFeaturesToken: 'features-token',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get offline user features if the procedure fails', async () => {
    response.locals.offlineUserEmail = 'test@test.com'
    response.locals.offlineFeaturesToken = 'features-token'

    getUserFeatures.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().getOfflineFeatures(request, response)
    const result = await httpResponse.executeAsync()

    expect(getUserFeatures.execute).toHaveBeenCalledWith({
      email: 'test@test.com',
      offline: true,
      offlineFeaturesToken: 'features-token',
    })

    expect(result.statusCode).toEqual(400)

  })
})
