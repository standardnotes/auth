import 'reflect-metadata'

import * as express from 'express'
import { decode } from 'jsonwebtoken'

import { SessionsController } from './SessionsController'
import { results } from 'inversify-express-utils'
import { Session } from '../Domain/Session/Session'
import { ProjectorInterface } from '../Projection/ProjectorInterface'
import { GetActiveSessionsForUser } from '../Domain/UseCase/GetActiveSessionsForUser'
import { AuthenticateRequest } from '../Domain/UseCase/AuthenticateRequest'
import { User } from '../Domain/User/User'

describe('SessionsController', () => {
  let getActiveSessionsForUser: GetActiveSessionsForUser
  let authenticateRequest: AuthenticateRequest
  let userProjector: ProjectorInterface<User>
  const jwtSecret = 'auth_jwt_secret'
  let sessionProjector: ProjectorInterface<Session>
  let session: Session
  let request: express.Request
  let response: express.Response

  const createController = () => new SessionsController(
    getActiveSessionsForUser,
    authenticateRequest,
    userProjector,
    sessionProjector,
    jwtSecret
  )

  beforeEach(() => {
    session = {} as jest.Mocked<Session>

    getActiveSessionsForUser = {} as jest.Mocked<GetActiveSessionsForUser>
    getActiveSessionsForUser.execute = jest.fn().mockReturnValue({ sessions: [session] })

    authenticateRequest = {} as jest.Mocked<AuthenticateRequest>
    authenticateRequest.execute = jest.fn()

    userProjector = {} as jest.Mocked<ProjectorInterface<User>>
    userProjector.projectSimple = jest.fn().mockReturnValue({ bar: 'baz' })

    sessionProjector = {} as jest.Mocked<ProjectorInterface<Session>>
    sessionProjector.projectCustom = jest.fn().mockReturnValue({ foo: 'bar' })
    sessionProjector.projectSimple = jest.fn().mockReturnValue({ test: 'test' })

    request = {
      params: {},
      headers: {}
    } as jest.Mocked<express.Request>

    response = {
      locals: {}
    } as jest.Mocked<express.Response>
  })

  it('should get all active sessions for current user', async () => {
    response.locals = {
      user: {
        uuid: '123',
      },
      session: {
        uuid: '234',
      },
    }

    const httpResponse = await createController().getSessions(request, response)

    expect(httpResponse).toBeInstanceOf(results.JsonResult)

    const result = await httpResponse.executeAsync()
    expect(await result.content.readAsStringAsync()).toEqual('[{"foo":"bar"}]')
  })

  it('should validate a session from an incoming request', async () => {
    const user = {} as jest.Mocked<User>
    authenticateRequest.execute = jest.fn().mockReturnValue({
      success: true,
      user,
      session
    })

    request.headers.authorization = 'test'

    const httpResponse = await createController().validate(request)

    expect(httpResponse).toBeInstanceOf(results.JsonResult)

    const result = await httpResponse.executeAsync()
    const httpResponseContent = await result.content.readAsStringAsync()
    const httpResponseJSON = JSON.parse(httpResponseContent)

    expect(decode(httpResponseJSON.authToken)).toEqual({
      iat: expect.any(Number),
      session: {
        test: 'test',
      },
      user:  {
        bar: 'baz',
      },
    })
  })

  it('should not validate a session from an incoming request', async () => {
    authenticateRequest.execute = jest.fn().mockReturnValue({
      success: false,
      errorTag: 'invalid-auth',
      errorMessage: 'Invalid login credentials.',
      responseCode: 401
    })

    request.headers.authorization = 'test'

    const httpResponse = await createController().validate(request)

    expect(httpResponse).toBeInstanceOf(results.JsonResult)
    expect(httpResponse.statusCode).toEqual(401)

    const result = await httpResponse.executeAsync()
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"tag":"invalid-auth","message":"Invalid login credentials."}}')
  })
})
