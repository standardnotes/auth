import 'reflect-metadata'

import * as express from 'express'

import { TokensController } from './TokensController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { CreateEphemeralToken } from '../Domain/UseCase/CreateEphemeralToken/CreateEphemeralToken'
import { CreateEphemeralTokenResponse } from '../Domain/UseCase/CreateEphemeralToken/CreateEphemeralTokenResponse'

describe('TokensController', () => {
  let createEphemeralToken: CreateEphemeralToken

  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new TokensController(
    createEphemeralToken,
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    user.uuid = '123'

    createEphemeralToken = {} as jest.Mocked<CreateEphemeralToken>
    createEphemeralToken.execute = jest.fn().mockReturnValue({} as jest.Mocked<CreateEphemeralTokenResponse>)

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
})
