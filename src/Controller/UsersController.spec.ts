import 'reflect-metadata'

import * as express from 'express'

import { UsersController } from './UsersController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { DeleteAccount } from '../Domain/UseCase/DeleteAccount/DeleteAccount'
import { GetUserSubscription } from '../Domain/UseCase/GetUserSubscription/GetUserSubscription'

describe('UsersController', () => {
  let updateUser: UpdateUser
  let deleteAccount: DeleteAccount
  let getUserKeyParams: GetUserKeyParams
  let getUserSubscription: GetUserSubscription

  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new UsersController(
    updateUser,
    getUserKeyParams,
    deleteAccount,
    getUserSubscription,
  )

  beforeEach(() => {
    updateUser = {} as jest.Mocked<UpdateUser>
    updateUser.execute = jest.fn()

    deleteAccount = {} as jest.Mocked<DeleteAccount>
    deleteAccount.execute = jest.fn().mockReturnValue({ success: true, message: 'A OK', responseCode: 200 })

    user = {} as jest.Mocked<User>
    user.uuid = '123'

    getUserKeyParams = {} as jest.Mocked<GetUserKeyParams>
    getUserKeyParams.execute = jest.fn()

    getUserSubscription = {} as jest.Mocked<GetUserSubscription>
    getUserSubscription.execute = jest.fn()

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>

    response = {
      locals: {},
    } as jest.Mocked<express.Response>
  })

  it('should update user', async () => {
    request.body.version = '002'
    request.body.api = '20190520'
    request.body.origination = 'test'
    request.body.email = 'newemail@test.te'
    request.params.userId = '123'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    updateUser.execute = jest.fn().mockReturnValue({ success: true, authResponse: { foo: 'bar' } })

    const httpResponse = <results.JsonResult> await createController().update(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateUser.execute).toHaveBeenCalledWith({
      apiVersion: '20190520',
      kpOrigination: 'test',
      updatedWithUserAgent: 'Google Chrome',
      email: 'newemail@test.te',
      version: '002',
      user: {
        uuid: '123',
      },
    })

    expect(result.statusCode).toEqual(200)
    expect(await result.content.readAsStringAsync()).toEqual('{"foo":"bar"}')
  })

  it('should not update a user if the procedure fails', async () => {
    request.body.version = '002'
    request.body.api = '20190520'
    request.body.origination = 'test'
    request.body.email = 'newemail@test.te'
    request.params.userId = '123'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    updateUser.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().update(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateUser.execute).toHaveBeenCalledWith({
      apiVersion: '20190520',
      kpOrigination: 'test',
      updatedWithUserAgent: 'Google Chrome',
      email: 'newemail@test.te',
      version: '002',
      user: {
        uuid: '123',
      },
    })

    expect(result.statusCode).toEqual(400)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Could not update user."}}')
  })

  it('should not update a user if it is not the same as logged in user', async () => {
    request.body.version = '002'
    request.body.api = '20190520'
    request.body.origination = 'test'
    request.params.userId = '234'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    const httpResponse = <results.JsonResult> await createController().update(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateUser.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Operation not allowed."}}')
  })

  it('should delete user', async () => {
    request.params.email = 'test@test.te'

    const httpResponse = <results.JsonResult> await createController().deleteAccount(request)
    const result = await httpResponse.executeAsync()

    expect(deleteAccount.execute).toHaveBeenCalledWith({ email: 'test@test.te' })

    expect(result.statusCode).toEqual(200)
    expect(await result.content.readAsStringAsync()).toEqual('{"message":"A OK"}')
  })

  it('should get user key params', async () => {
    request.query = {
      email: 'test@test.te',
      uuid: '1-2-3',
    }

    getUserKeyParams.execute = jest.fn().mockReturnValue({ foo: 'bar' })

    const httpResponse = <results.JsonResult> await createController().keyParams(request)
    const result = await httpResponse.executeAsync()

    expect(getUserKeyParams.execute).toHaveBeenCalledWith({
      email: 'test@test.te',
      userUuid: '1-2-3',
      authenticated: false,
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should get authenticated user key params', async () => {
    request.query = {
      email: 'test@test.te',
      uuid: '1-2-3',
      authenticated: 'true',
    }

    getUserKeyParams.execute = jest.fn().mockReturnValue({ foo: 'bar' })

    const httpResponse = <results.JsonResult> await createController().keyParams(request)
    const result = await httpResponse.executeAsync()

    expect(getUserKeyParams.execute).toHaveBeenCalledWith({
      email: 'test@test.te',
      userUuid: '1-2-3',
      authenticated: true,
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get user key params if email and user uuid is missing', async () => {
    request.query = {
    }

    getUserKeyParams.execute = jest.fn().mockReturnValue({ foo: 'bar' })

    const httpResponse = <results.JsonResult> await createController().keyParams(request)
    const result = await httpResponse.executeAsync()

    expect(getUserKeyParams.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
  })

  it('should get user subscription', async () => {
    request.params = {
      userUuid: '1-2-3',
    }

    response.locals.user = {
      uuid: '1-2-3',
    }

    getUserSubscription.execute = jest.fn().mockReturnValue({
      success: true,
    })

    const httpResponse = <results.JsonResult> await createController().getSubscription(request, response)
    const result = await httpResponse.executeAsync()
    
    expect(getUserSubscription.execute).toHaveBeenCalledWith({
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })
})
