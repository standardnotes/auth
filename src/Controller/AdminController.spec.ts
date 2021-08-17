import 'reflect-metadata'

import { AdminController } from './AdminController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { UserRepositoryInterface } from '../Domain/User/UserRepositoryInterface'
import * as express from 'express'

describe('AdminController', () => {
  let userRepository: UserRepositoryInterface
  let request: express.Request
  let user: User

  const createController = () => new AdminController(
    userRepository,
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    user.uuid = '123'

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>
  })

  it('should return error if missing email parameter', async () => {
    const httpResponse = await createController().getUser(request)
    const result = await httpResponse.executeAsync()

    expect(httpResponse).toBeInstanceOf(results.JsonResult)

    expect(result.statusCode).toBe(400)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Missing email parameter."}}')
  })

  it('should return error if no user with such email exists', async () => {
    request.params.email = 'test@sn.org'

    userRepository.findOneByEmail = jest.fn().mockReturnValue(null)

    const httpResponse = await createController().getUser(request)
    const result = await httpResponse.executeAsync()

    expect(httpResponse).toBeInstanceOf(results.JsonResult)

    expect(result.statusCode).toBe(400)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"No user with email \'test@sn.org\'."}}')
  })

  it('should return the user\'s uuid', async () => {
    request.params.email = 'test@sn.org'

    const httpResponse = await createController().getUser(request)
    const result = await httpResponse.executeAsync()

    expect(httpResponse).toBeInstanceOf(results.JsonResult)

    expect(result.statusCode).toBe(200)
    expect(await result.content.readAsStringAsync()).toEqual('{"uuid":"123"}')
  })
})
