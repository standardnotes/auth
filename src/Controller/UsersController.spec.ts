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

describe('UsersController', () => {
  let updateUser: UpdateUser
  let request: express.Request
  let response: express.Response
  let user: User

  const createControllerWithMocks = () => new UsersController(
    updateUser,
    {} as jest.Mocked<GetSettings>,
    {} as jest.Mocked<GetSetting>,
    {} as jest.Mocked<GetUserKeyParams>
  )

  beforeEach(() => {
    updateUser = {} as jest.Mocked<UpdateUser>
    updateUser.execute = jest.fn()

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
    })

    const actual = await subject.getSetting(request, response)

    expect(actual.statusCode).toEqual(400)
    expect(actual.json).toHaveProperty('error')
  })

  it('should get user key params', async () => {
    const subject = UsersControllerTest.makeSubject({
      updateUser,
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

  it('should get user key params for authenticated user', async () => {
    const subject = UsersControllerTest.makeSubject({
      updateUser,
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

  it('should error when email parameter is not given in query when gettting user key params', async () => {
    const subject = UsersControllerTest.makeSubject({
      updateUser,
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
    const setting = settings[0]

    Object.assign(request, {
      params: { userUuid, settingName: setting.name }
    })    
    
    const repository = new SettingRepostioryStub(settings)
    const projector = SettingProjectorTest.get()
    const subject = UsersControllerTest.makeSubject({
      updateUser,
      repository,
      projector,
    })

    const expectedSetting = await projector.projectSimple(setting)

    const actual = await subject.updateSetting(
      request, 
      response,
    )

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      success: true,
      userUuid,
      setting: expectedSetting,
    })
  })
})
