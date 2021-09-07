import 'reflect-metadata'

import * as express from 'express'

import { AccountController } from './AccountController'
import { results } from 'inversify-express-utils'
import { ClearLoginAttempts } from '../Domain/UseCase/ClearLoginAttempts'
import { IncreaseLoginAttempts } from '../Domain/UseCase/IncreaseLoginAttempts'
import { User } from '../Domain/User/User'
import { ChangeCredentials } from '../Domain/UseCase/ChangeCredentials/ChangeCredentials'

describe('AccountController', () => {
  let clearLoginAttempts: ClearLoginAttempts
  let increaseLoginAttempts: IncreaseLoginAttempts
  let changeCredentials: ChangeCredentials
  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new AccountController(
    clearLoginAttempts,
    increaseLoginAttempts,
    changeCredentials,
  )

  beforeEach(() => {
    changeCredentials = {} as jest.Mocked<ChangeCredentials>
    changeCredentials.execute = jest.fn()

    user = {} as jest.Mocked<User>
    user.email = 'test@test.te'

    clearLoginAttempts = {} as jest.Mocked<ClearLoginAttempts>
    clearLoginAttempts.execute = jest.fn()

    increaseLoginAttempts = {} as jest.Mocked<IncreaseLoginAttempts>
    increaseLoginAttempts.execute = jest.fn()

    request = {
      headers: {},
      body: {},
      query: {},
    } as jest.Mocked<express.Request>

    response = {
      locals: {},
    } as jest.Mocked<express.Response>
  })

  it('should change a password', async () => {
    request.body.version = '004'
    request.body.api = '20190520'
    request.body.current_password = 'test123'
    request.body.new_password = 'test234'
    request.body.pw_nonce = 'asdzxc'
    request.body.origination = 'change-password'
    request.body.created = '123'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    changeCredentials.execute = jest.fn().mockReturnValue({ success: true, authResponse: { foo: 'bar' } })

    const httpResponse = <results.JsonResult> await createController().changeCredentials(request, response)
    const result = await httpResponse.executeAsync()

    expect(changeCredentials.execute).toHaveBeenCalledWith({
      apiVersion: '20190520',
      updatedWithUserAgent: 'Google Chrome',
      currentPassword: 'test123',
      newPassword: 'test234',
      kpCreated: '123',
      kpOrigination: 'change-password',
      pwNonce: 'asdzxc',
      protocolVersion: '004',
      user: {
        email: 'test@test.te',
      },
    })

    expect(clearLoginAttempts.execute).toHaveBeenCalled()

    expect(result.statusCode).toEqual(200)
    expect(await result.content.readAsStringAsync()).toEqual('{"foo":"bar"}')
  })

  it('should indicate if changing a password fails', async () => {
    request.body.version = '004'
    request.body.api = '20190520'
    request.body.current_password = 'test123'
    request.body.new_password = 'test234'
    request.body.pw_nonce = 'asdzxc'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    changeCredentials.execute = jest.fn().mockReturnValue({ success: false, errorMessage: 'Something bad happened' })

    const httpResponse = <results.JsonResult> await createController().changeCredentials(request, response)
    const result = await httpResponse.executeAsync()

    expect(increaseLoginAttempts.execute).toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Something bad happened"}}')
  })

  it('should not change a password if current password is missing', async () => {
    request.body.version = '004'
    request.body.api = '20190520'
    request.body.new_password = 'test234'
    request.body.pw_nonce = 'asdzxc'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    const httpResponse = <results.JsonResult> await createController().changeCredentials(request, response)
    const result = await httpResponse.executeAsync()

    expect(changeCredentials.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Your current password is required to change your password. Please update your application if you do not see this option."}}')
  })

  it('should not change a password if new password is missing', async () => {
    request.body.version = '004'
    request.body.api = '20190520'
    request.body.current_password = 'test123'
    request.body.pw_nonce = 'asdzxc'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    const httpResponse = <results.JsonResult> await createController().changeCredentials(request, response)
    const result = await httpResponse.executeAsync()

    expect(changeCredentials.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Your new password is required to change your password. Please try again."}}')
  })

  it('should not change a password if password nonce is missing', async () => {
    request.body.version = '004'
    request.body.api = '20190520'
    request.body.current_password = 'test123'
    request.body.new_password = 'test234'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    const httpResponse = <results.JsonResult> await createController().changeCredentials(request, response)
    const result = await httpResponse.executeAsync()

    expect(changeCredentials.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"The change password request is missing new auth parameters. Please try again."}}')
  })
})
