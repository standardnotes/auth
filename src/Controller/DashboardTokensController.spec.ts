import 'reflect-metadata'

import * as express from 'express'
import { results } from 'inversify-express-utils'

import { DashboardTokensController } from './DashboardTokensController'
import { CreateDashboardToken } from '../Domain/UseCase/CreateDashboardToken/CreateDashboardToken'
import { CreateDashboardTokenResponse } from '../Domain/UseCase/CreateDashboardToken/CreateDashboardTokenResponse'
import { AuthenticateDashboardToken } from '../Domain/UseCase/AuthenticateDashboardToken/AuthenticateDashboardToken'
import { OfflineUserSubscription } from '../Domain/Subscription/OfflineUserSubscription'

describe('DashboardTokensController', () => {
  let createDashboardToken: CreateDashboardToken
  let authenticateToken: AuthenticateDashboardToken

  let request: express.Request

  const createController = () => new DashboardTokensController(
    createDashboardToken,
    authenticateToken,
  )

  beforeEach(() => {
    createDashboardToken = {} as jest.Mocked<CreateDashboardToken>
    createDashboardToken.execute = jest.fn().mockReturnValue({
      dashboardToken: {
        token: 'test',
      },
    } as jest.Mocked<CreateDashboardTokenResponse>)

    authenticateToken = {} as jest.Mocked<AuthenticateDashboardToken>
    authenticateToken.execute = jest.fn().mockReturnValue({
      success: true,
      email: 'test@test.com',
      subscriptions: [ {} as jest.Mocked<OfflineUserSubscription> ],
    })

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>
  })

  it('should create a dashboard token for authenticated user', async () => {
    request.body.email = 'test@test.com'

    const httpResponse = <results.JsonResult> await createController().createToken(request)
    const result = await httpResponse.executeAsync()

    expect(createDashboardToken.execute).toHaveBeenCalledWith({
      userEmail: 'test@test.com',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not create a dashboard token for missing email in request', async () => {
    const httpResponse = <results.JsonResult> await createController().createToken(request)
    const result = await httpResponse.executeAsync()

    expect(createDashboardToken.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
  })

  it('should validate a dashboard token for user', async () => {
    request.params.token = 'test'
    request.body.email = 'test@test.com'

    const httpResponse = <results.JsonResult> await createController().validate(request)
    const result = await httpResponse.executeAsync()

    expect(authenticateToken.execute).toHaveBeenCalledWith({
      token: 'test',
      userEmail: 'test@test.com',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not validate a dashboard token for user if it is invalid', async () => {
    request.body.email = 'test@test.com'
    request.params.token = 'test'

    authenticateToken.execute = jest.fn().mockReturnValue({
      success: false,
    })

    const httpResponse = <results.JsonResult> await createController().validate(request)
    const result = await httpResponse.executeAsync()

    expect(authenticateToken.execute).toHaveBeenCalledWith({
      token: 'test',
      userEmail: 'test@test.com',
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should not validate a dashboard token for user if email is missing', async () => {
    request.params.token = 'test'

    const httpResponse = <results.JsonResult> await createController().validate(request)
    const result = await httpResponse.executeAsync()

    expect(authenticateToken.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
  })
})
