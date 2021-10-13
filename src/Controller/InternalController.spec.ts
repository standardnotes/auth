import 'reflect-metadata'

import * as express from 'express'

import { InternalController } from './InternalController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'

describe('InternalController', () => {
  let getUserFeatures: GetUserFeatures

  let request: express.Request
  let user: User

  const createController = () => new InternalController(
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
  })

  it('should get user features', async () => {
    request.params.userUuid = '1-2-3'

    getUserFeatures.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().getFeatures(request)
    const result = await httpResponse.executeAsync()

    expect(getUserFeatures.execute).toHaveBeenCalledWith({
      userUuid: '1-2-3',
      offline: false,
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get user features if the user with provided uuid does not exist', async () => {
    request.params.userUuid = '1-2-3'

    getUserFeatures.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().getFeatures(request)
    const result = await httpResponse.executeAsync()

    expect(getUserFeatures.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', offline: false })

    expect(result.statusCode).toEqual(400)

  })
})
