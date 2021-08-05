import 'reflect-metadata'

import * as express from 'express'

import { UsersController } from './UsersController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { UpdateSetting } from '../Domain/UseCase/UpdateSetting/UpdateSetting'
import { DeleteAccount } from '../Domain/UseCase/DeleteAccount/DeleteAccount'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'
import { Setting } from '../Domain/Setting/Setting'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'

describe('UsersController', () => {
  let updateUser: UpdateUser
  let deleteAccount: DeleteAccount
  let deleteSetting: DeleteSetting
  let getSettings: GetSettings
  let getSetting: GetSetting
  let getUserFeatures: GetUserFeatures
  let getUserKeyParams: GetUserKeyParams
  let updateSetting: UpdateSetting

  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new UsersController(
    updateUser,
    getSettings,
    getSetting,
    getUserFeatures,
    getUserKeyParams,
    updateSetting,
    deleteAccount,
    deleteSetting,
  )

  beforeEach(() => {
    updateUser = {} as jest.Mocked<UpdateUser>
    updateUser.execute = jest.fn()

    deleteAccount = {} as jest.Mocked<DeleteAccount>
    deleteAccount.execute = jest.fn().mockReturnValue({ success: true, message: 'A OK', responseCode: 200 })

    deleteSetting = {} as jest.Mocked<DeleteSetting>
    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

    user = {} as jest.Mocked<User>
    user.uuid = '123'

    getSettings = {} as jest.Mocked<GetSettings>
    getSettings.execute = jest.fn()

    getSetting = {} as jest.Mocked<GetSetting>
    getSetting.execute = jest.fn()

    getUserKeyParams = {} as jest.Mocked<GetUserKeyParams>
    getUserKeyParams.execute = jest.fn()

    updateSetting = {} as jest.Mocked<UpdateSetting>
    updateSetting.execute = jest.fn()

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

  it('should update user', async () => {
    request.body.version = '002'
    request.body.api = '20190520'
    request.body.origination = 'test'
    request.params.userId = '123'
    request.headers['user-agent'] = 'Google Chrome'
    response.locals.user = user

    updateUser.execute = jest.fn().mockReturnValue({ authResponse: { foo: 'bar' } })

    const httpResponse = <results.JsonResult> await createController().update(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateUser.execute).toHaveBeenCalledWith({
      apiVersion: '20190520',
      kpOrigination: 'test',
      updatedWithUserAgent: 'Google Chrome',
      version: '002',
      user: {
        uuid: '123',
      },
    })

    expect(result.statusCode).toEqual(200)
    expect(await result.content.readAsStringAsync()).toEqual('{"foo":"bar"}')
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

  it('should get user settings', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    const httpResponse = <results.JsonResult> await createController().getSettings(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).toHaveBeenCalledWith({ userUuid: '1-2-3' })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get user settings if not allowed', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '2-3-4',
    }

    const httpResponse = <results.JsonResult> await createController().getSettings(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should get user mfa setting', async () => {
    request.params.userUuid = '1-2-3'
    request.body.lastSyncTime = 123

    getSettings.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().getMFASettings(request)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', allowMFARetrieval: true, updatedAfter: 123 })

    expect(result.statusCode).toEqual(200)
  })

  it('should fail if could not get user mfa setting', async () => {
    request.params.userUuid = '1-2-3'

    getSettings.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().getMFASettings(request)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', allowMFARetrieval: true })

    expect(result.statusCode).toEqual(400)
  })

  it('should delete user mfa setting', async () => {
    request.params.userUuid = '1-2-3'

    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().deleteMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', softDelete: true })

    expect(result.statusCode).toEqual(200)
  })

  it('should fail if could not delete user mfa setting', async () => {
    request.params.userUuid = '1-2-3'

    deleteSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().deleteMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', softDelete: true })

    expect(result.statusCode).toEqual(400)
  })

  it('should update user mfa setting with default encoded and encrypted setting', async () => {
    request.params.userUuid = '1-2-3'
    request.body = {
      uuid: '2-3-4',
      value: 'test',
      createdAt: 123,
      updatedAt: 234,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        createdAt: 123,
        name: 'MFA_SECRET',
        serverEncryptionVersion: Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
        updatedAt: 234,
        uuid: '2-3-4',
        value: 'test',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should update user mfa setting with different encryption', async () => {
    request.params.userUuid = '1-2-3'
    request.body = {
      uuid: '2-3-4',
      value: 'test',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
      createdAt: 123,
      updatedAt: 234,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        createdAt: 123,
        name: 'MFA_SECRET',
        serverEncryptionVersion: 1,
        updatedAt: 234,
        uuid: '2-3-4',
        value: 'test',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should fail if could not update user mfa setting', async () => {
    request.params.userUuid = '1-2-3'
    request.body = {
      uuid: '2-3-4',
      value: 'test',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
      createdAt: 123,
      updatedAt: 234,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().updateMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        createdAt: 123,
        name: 'MFA_SECRET',
        serverEncryptionVersion: 2,
        updatedAt: 234,
        uuid: '2-3-4',
        value: 'test',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(400)
  })

  it('should get user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'test'
    response.locals.user = {
      uuid: '1-2-3',
    }

    getSetting.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().getSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'test' })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get user setting if not allowed', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'test'
    response.locals.user = {
      uuid: '2-3-4',
    }

    getSetting.execute = jest.fn()

    const httpResponse = <results.JsonResult> await createController().getSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSetting.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should fail if could not get user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'test'
    response.locals.user = {
      uuid: '1-2-3',
    }

    getSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().getSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'test' })

    expect(result.statusCode).toEqual(400)
  })

  it('should update user setting with default encryption', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        name: 'foo',
        serverEncryptionVersion: 1,
        value: 'bar',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should update user setting with different encryption setting', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        name: 'foo',
        serverEncryptionVersion: 0,
        value: 'bar',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not update user setting if not allowed', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '2-3-4',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    }

    updateSetting.execute = jest.fn()

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should fail if could not update user setting', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        name: 'foo',
        serverEncryptionVersion: 1,
        value: 'bar',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(400)
  })

  it('should delete user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'foo'
    response.locals.user = {
      uuid: '1-2-3',
    }

    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().deleteSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'foo' })

    expect(result.statusCode).toEqual(200)
  })

  it('should not delete user setting if user is not allowed', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'foo'
    response.locals.user = {
      uuid: '2-3-4',
    }

    deleteSetting.execute = jest.fn()

    const httpResponse = <results.JsonResult> await createController().deleteSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should fail if could not delete user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'foo'
    response.locals.user = {
      uuid: '1-2-3',
    }

    deleteSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().deleteSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'foo' })

    expect(result.statusCode).toEqual(400)
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

  describe('getUserFeatures', () => {
    it('should get authenticated user features', async () => {
      request.params.userUuid = '1-2-3'
      response.locals.user =  {
        uuid: '1-2-3',
      }

      getUserFeatures.execute = jest.fn().mockReturnValue({ success: true })

      const httpResponse = <results.JsonResult> await createController().getFeatures(request, response)
      const result = await httpResponse.executeAsync()

      expect(getUserFeatures.execute).toHaveBeenCalledWith({
        userUuid: '1-2-3',
      })

      expect(result.statusCode).toEqual(200)
    })

    it('should not get user features if the user with provided uuid does not exist', async () => {
      request.params.userUuid = '1-2-3'
      response.locals.user = {
        uuid: '1-2-3',
      }

      getUserFeatures.execute = jest.fn().mockReturnValue({ success: false })

      const httpResponse = <results.JsonResult> await createController().getFeatures(request, response)
      const result = await httpResponse.executeAsync()

      expect(getUserFeatures.execute).toHaveBeenCalledWith({ userUuid: '1-2-3' })

      expect(result.statusCode).toEqual(400)

    })

    it('should not get user features if not allowed', async () => {
      request.params.userUuid = '1-2-3'
      response.locals.user = {
        uuid: '2-3-4',
      }

      getUserFeatures.execute = jest.fn()

      const httpResponse = <results.JsonResult> await createController().getFeatures(request, response)
      const result = await httpResponse.executeAsync()

      expect(getUserFeatures.execute).not.toHaveBeenCalled()

      expect(result.statusCode).toEqual(401)
    })
  })
})
