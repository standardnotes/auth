import 'reflect-metadata'

import * as express from 'express'
import { results } from 'inversify-express-utils'

import { TokensController } from './TokensController'
import { User } from '../Domain/User/User'
import { CreateEphemeralToken } from '../Domain/UseCase/CreateEphemeralToken/CreateEphemeralToken'
import { CreateEphemeralTokenResponse } from '../Domain/UseCase/CreateEphemeralToken/CreateEphemeralTokenResponse'
import { AuthenticateToken } from '../Domain/UseCase/AuthenticateToken/AuthenticateToken'
import { ProjectorInterface } from '../Projection/ProjectorInterface'
import { Role } from '../Domain/Role/Role'

describe('TokensController', () => {
  let createEphemeralToken: CreateEphemeralToken
  let authenticateToken: AuthenticateToken
  const jwtSecret = 'auth_jwt_secret'
  const jwtTTL = 60
  let userProjector: ProjectorInterface<User>
  let roleProjector: ProjectorInterface<Role>

  let request: express.Request
  let response: express.Response
  let user: User
  let role: Role

  const createController = () => new TokensController(
    createEphemeralToken,
    authenticateToken,
    userProjector,
    roleProjector,
    jwtSecret,
    jwtTTL
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    user.uuid = '123'
    user.roles = Promise.resolve([ role ])

    createEphemeralToken = {} as jest.Mocked<CreateEphemeralToken>
    createEphemeralToken.execute = jest.fn().mockReturnValue({} as jest.Mocked<CreateEphemeralTokenResponse>)

    authenticateToken = {} as jest.Mocked<AuthenticateToken>
    authenticateToken.execute = jest.fn().mockReturnValue({
      success: true,
      user,
    })

    userProjector = {} as jest.Mocked<ProjectorInterface<User>>
    userProjector.projectSimple = jest.fn().mockReturnValue({ bar: 'baz' })

    roleProjector = {} as jest.Mocked<ProjectorInterface<Role>>
    roleProjector.projectSimple = jest.fn().mockReturnValue({ name: 'role1', uuid: '1-3-4' })

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>

    response = {
      locals: {},
    } as jest.Mocked<express.Response>
  })

  it('should create an ephemeral token for authenticated user', async () => {
    response.locals.user =  {
      uuid: '1-2-3',
      email: 'test@test.te',
    }

    const httpResponse = <results.JsonResult> await createController().createToken(request, response)
    const result = await httpResponse.executeAsync()

    expect(createEphemeralToken.execute).toHaveBeenCalledWith({
      userUuid: '1-2-3',
      email: 'test@test.te',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should validate an ephemeral token for user', async () => {
    request.params.token = 'test'

    const httpResponse = <results.JsonResult> await createController().validate(request)
    const result = await httpResponse.executeAsync()

    expect(authenticateToken.execute).toHaveBeenCalledWith({
      token: 'test',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not validate an ephemeral token for user if it is invalid', async () => {
    request.params.token = 'test'

    authenticateToken.execute = jest.fn().mockReturnValue({
      success: false,
    })

    const httpResponse = <results.JsonResult> await createController().validate(request)
    const result = await httpResponse.executeAsync()

    expect(authenticateToken.execute).toHaveBeenCalledWith({
      token: 'test',
    })

    expect(result.statusCode).toEqual(401)
  })
})
