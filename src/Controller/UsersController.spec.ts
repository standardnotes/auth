import 'reflect-metadata'

import * as express from 'express'

import { UsersController } from './UsersController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'
import { UserTest } from '../Domain/User/test/UserTest'
import { SettingProjectorTest } from '../Projection/test/SettingProjectorTest'
import { SettingRepostioryStub } from '../Domain/Setting/test/SettingRepositoryStub'
import { UsersControllerTest } from './test/UsersControllerTest'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { UserRepostioryStub } from '../Domain/User/test/UserRepostioryStub'
import { UpdateSetting } from '../Domain/UseCase/UpdateSetting/UpdateSetting'
import { DeleteAccount } from '../Domain/UseCase/DeleteAccount/DeleteAccount'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'
import { GetMFASetting } from '../Domain/UseCase/GetMFASetting/GetMFASetting'
import { Setting } from '../Domain/Setting/Setting'

describe('UsersController', () => {
  let updateUser: UpdateUser
  let deleteAccount: DeleteAccount
  let request: express.Request
  let response: express.Response
  let user: User

  const createControllerWithMocks = () => new UsersController(
    updateUser,
    {} as jest.Mocked<GetSettings>,
    {} as jest.Mocked<GetSetting>,
    {} as jest.Mocked<GetMFASetting>,
    {} as jest.Mocked<GetUserKeyParams>,
    {} as jest.Mocked<UpdateSetting>,
    deleteAccount,
    {} as jest.Mocked<DeleteSetting>,
  )

  beforeEach(() => {
    updateUser = {} as jest.Mocked<UpdateUser>
    updateUser.execute = jest.fn()

    deleteAccount = {} as jest.Mocked<DeleteAccount>
    deleteAccount.execute = jest.fn().mockReturnValue({ success: true, message: 'A OK', responseCode: 200 })

    user = {} as jest.Mocked<User>
    user.uuid = '123'

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

    const httpResponse = <results.JsonResult> await createControllerWithMocks().update(request, response)
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

    const httpResponse = <results.JsonResult> await createControllerWithMocks().update(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateUser.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
    expect(await result.content.readAsStringAsync()).toEqual('{"error":{"message":"Operation not allowed."}}')
  })

  it('should delete user', async () => {
    request.params.email = 'test@test.te'

    const httpResponse = <results.JsonResult> await createControllerWithMocks().deleteAccount(request)
    const result = await httpResponse.executeAsync()

    expect(deleteAccount.execute).toHaveBeenCalledWith({ email: 'test@test.te' })

    expect(result.statusCode).toEqual(200)
    expect(await result.content.readAsStringAsync()).toEqual('{"message":"A OK"}')
  })

  it('should get user settings for vaild user uuid', async () => {
    const userUuid = 'user-1'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    }, {
      settings: [
        { uuid: 'setting-1' },
      ],
    })
    Object.assign(request, {
      params: { userUuid },
    })
    response.locals.user = user

    const settings = await user.settings

    const projector = SettingProjectorTest.get()
    const simpleSettings = await projector.projectManySimple(settings)
    const repository = new SettingRepostioryStub(settings)

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository: repository,
      projector,
    })
    const actual = await subject.getSettings(request, response)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      success: true,
      userUuid,
      settings: simpleSettings,
    })
  })

  it('should error when geting user settings for invaild user uuid', async () => {
    const userUuid = 'user-1'
    const badUserUuid = 'BAD-user-uuid'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    Object.assign(request, {
      params: { userUuid: badUserUuid },
    })
    response.locals.user = user

    const actual = await createControllerWithMocks().getSettings(request, response)

    expect(actual.statusCode).toEqual(401)
    expect(actual.json).toHaveProperty('error')
  })

  it('should get user setting by name for vaild user uuid', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid
    response.locals.user = user

    const settings = await user.settings
    const settingIndex = 0

    Object.assign(request, {
      params: { userUuid, settingName: settings[settingIndex].name },
    })

    const repository = new SettingRepostioryStub(settings)
    const projector = SettingProjectorTest.get()
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository: repository,
      projector,
    })

    const expectedSetting = await projector.projectSimple(settings[settingIndex])

    const actual = await subject.getSetting(request, response)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      success: true,
      userUuid,
      setting: expectedSetting,
    })
  })

  it('should get user mfa secret for vaild user uuid', async () => {
    const user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-2-uuid', name: 'MFA_SECRET', serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: 'setting-3-name' },
      ],
    })
    const userUuid = user.uuid
    response.locals.user = user

    const settings = await user.settings
    const settingIndex = 0

    Object.assign(request, {
      params: { userUuid },
    })

    const repository = new SettingRepostioryStub(settings)
    const projector = SettingProjectorTest.get()
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository: repository,
      projector,
    })

    const expectedSetting = await projector.projectSimple(settings[settingIndex])

    const actual = await subject.getMFASetting(request, response)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      success: true,
      userUuid,
      setting: expectedSetting,
    })
  })

  it('should error when geting user mfa for invaild user uuid', async () => {
    const userUuid = 'user-1'
    const badUserUuid = 'BAD-user-uuid'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    Object.assign(request, {
      params: { userUuid: badUserUuid },
    })
    response.locals.user = user

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.getMFASetting(request, response)

    expect(actual.statusCode).toEqual(401)
    expect(actual.json).toHaveProperty('error')
  })

  it('should error when geting non existing mfa for vaild user uuid', async () => {
    const userUuid = 'user-1'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    Object.assign(request, {
      params: { userUuid },
    })
    response.locals.user = user

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.getMFASetting(request, response)

    expect(actual.statusCode).toEqual(400)
    expect(actual.json).toHaveProperty('error')
  })

  it('should error when geting user setting by name for invaild user uuid', async () => {
    const userUuid = 'user-1'
    const badUserUuid = 'BAD-user-uuid'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    Object.assign(request, {
      params: { userUuid: badUserUuid, settingName: 'irrelevant' },
    })
    response.locals.user = user

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.getSetting(request, response)

    expect(actual.statusCode).toEqual(401)
    expect(actual.json).toHaveProperty('error')
  })

  it('should error when geting user setting by invalid name for vaild user uuid', async () => {
    const userUuid = 'user-1'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    Object.assign(request, {
      params: { userUuid, settingName: 'BAD' },
    })
    response.locals.user = user

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.getSetting(request, response)

    expect(actual.statusCode).toEqual(400)
    expect(actual.json).toHaveProperty('error')
  })

  it('should get user key params by email', async () => {
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    Object.assign(request, {
      query: { email: 'test@test.com' },
    })

    const actual = await subject.keyParams(request)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      identifier: 'test@test.com',
      version: '004',
    })
  })

  it('should get user key params by uuid', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid

    const userRepository = new UserRepostioryStub([user])

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      userRepository,
    })

    Object.assign(request, {
      query: { uuid: userUuid },
    })

    const actual = await subject.keyParams(request)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      identifier: 'test@test.com',
      version: '004',
    })
  })

  it('should get user key params for authenticated user', async () => {
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    Object.assign(request, {
      query: { email: 'test@test.com', authenticated: 'true' },
    })

    const actual = await subject.keyParams(request)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      identifier: 'test@test.com',
      version: '004',
    })
  })

  it('should error when email and uuid parameters are not given in query when gettting user key params', async () => {
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    Object.assign(request, {
      query: {},
    })

    const actual = await subject.keyParams(request)

    expect(actual.statusCode).toEqual(400)
    expect(actual.json).toHaveProperty('error')
  })

  it('should create user setting for vaild user uuid', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid
    response.locals.user = user

    const settings = await user.settings

    Object.assign(request, {
      params: { userUuid },
      body: { name: 'NEW-setting', value: 'value' },
    })

    const userRepository = new UserRepostioryStub([user])
    const settingRepository = new SettingRepostioryStub(settings)
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository,
      userRepository,
    })

    const actual = await subject.updateSetting(
      request,
      response,
    )

    expect(actual).toMatchObject({ statusCode: 201 })
  })

  it('should create user mfa setting', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid

    const settings = await user.settings

    Object.assign(request, {
      params: { userUuid },
      body: { value: 'value' },
    })

    const userRepository = new UserRepostioryStub([user])
    const settingRepository = new SettingRepostioryStub(settings)
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository,
      userRepository,
    })

    const actual = await subject.updateMFASetting(
      request,
    )

    expect(actual).toMatchObject({ statusCode: 201 })
  })

  it('should replace user setting for vaild user uuid', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid
    response.locals.user = user

    const settings = await user.settings
    const setting = settings[0]

    Object.assign(request, {
      params: { userUuid },
      body: { name: setting.name, value: 'NEW-value' },
    })

    const userRepository = new UserRepostioryStub([user])
    const settingRepository = new SettingRepostioryStub(settings)
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository,
      userRepository,
    })

    const actual = await subject.updateSetting(
      request,
      response,
    )

    expect(actual).toMatchObject({ statusCode: 200 })
  })

  it('should replace user mfa setting', async () => {
    const user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-2-uuid', name: 'MFA_SECRET' },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: 'setting-3-name' },
      ],
    })
    const userUuid = user.uuid

    const settings = await user.settings

    Object.assign(request, {
      params: { userUuid },
      body: { value: 'NEW-value' },
    })

    const userRepository = new UserRepostioryStub([user])
    const settingRepository = new SettingRepostioryStub(settings)
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository,
      userRepository,
    })

    const actual = await subject.updateMFASetting(
      request,
    )

    expect(actual).toMatchObject({ statusCode: 200 })
  })

  it('should replace user setting for nonexistent user uuid', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid
    response.locals.user = user

    Object.assign(request, {
      params: { userUuid },
      body: { name: 'NEW-name', value: 'NEW-value' },
    })

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.updateSetting(
      request,
      response,
    )

    expect(actual).toMatchObject({ statusCode: 400 })
  })

  it('should error when creating/replacing user setting for invaild user uuid', async () => {
    const userUuid = 'user-1'
    const badUserUuid = 'BAD-user-uuid'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    Object.assign(request, {
      params: { userUuid: badUserUuid, settingName: 'irrelevant' },
    })
    response.locals.user = user

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.updateSetting(request, response)

    expect(actual).toMatchObject({ json: { error: expect.anything() } })
  })

  it('should error when creating/replacing user mfa setting for invaild user uuid', async () => {
    const badUserUuid = 'BAD-user-uuid'
    Object.assign(request, {
      params: { userUuid: badUserUuid, settingName: 'irrelevant' },
    })

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.updateMFASetting(request)

    expect(actual).toMatchObject({ json: { error: expect.anything() } })
  })

  it('should delete user setting if it exists', async () => {
    const user = UserTest.makeWithSettings()
    const userUuid = user.uuid
    const settings = await user.settings
    const setting = settings[0]
    const request: Partial<express.Request> = {
      params: { userUuid, settingName: setting.name },
    }
    const response: Partial<express.Response> = {
      locals: { user },
    }

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
      settingRepository: new SettingRepostioryStub(settings),
    })

    const actual = await subject.deleteSetting(
      request as express.Request,
      response as express.Response,
    )

    expect(actual.statusCode).toEqual(200)
  })

  it('should fail to delete user setting if it does not exist', async () => {
    const user = UserTest.makeSubject({})
    const userUuid = user.uuid
    const request: Partial<express.Request> = {
      params: { userUuid, settingName: 'BAD' },
    }
    const response: Partial<express.Response> = {
      locals: { user },
    }

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.deleteSetting(
      request as express.Request,
      response as express.Response,
    )

    expect(actual.statusCode).toEqual(400)
  })

  it('should error when deleting user setting for invaild user uuid', async () => {
    const userUuid = 'user-1'
    const badUserUuid = 'BAD-user-uuid'
    const user = UserTest.makeSubject({
      uuid: userUuid,
    })
    const request: Partial<express.Request> = {
      params: {
        userUuid: badUserUuid,
        settingName: 'irrelevant',
      },
    }
    const response: Partial<express.Response> = {
      locals: { user },
    }

    const subject = UsersControllerTest.makeSubject({
      updateUser,
      deleteAccount,
    })

    const actual = await subject.deleteSetting(
      request as express.Request,
      response as express.Response,
    )

    expect(actual.json).toHaveProperty('error')
  })
})
