import 'reflect-metadata'

import * as express from 'express'

import { UsersController } from './UsersController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'
import { GetSettingsTest } from '../Domain/UseCase/GetSettings/test/GetSettingsTest'
import { UserTest } from '../Domain/User/test/UserTest'

describe('UsersController', () => {
  let updateUser: UpdateUser
  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new UsersController(
    updateUser,
    GetSettingsTest.makeSubject(),
  )

  beforeEach(() => {
    updateUser = {} as jest.Mocked<UpdateUser>
    updateUser.execute = jest.fn()

    user = {} as jest.Mocked<User>
    user.uuid = '123'

    request = {
      headers: {},
      body: {},
      params: {}
    } as jest.Mocked<express.Request>

    response = {
      locals: {}
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
        uuid: '123'
      }
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

  // todo: most likely json returned from controller should not be straight stringified settings
  it('shoud get user settings for vaild user uuid', async () => {
    const userUuid = 'user-1'
    const user = UserTest.makeSubject({ 
      uuid: userUuid
    }, {
      settings: [
        { uuid: 'setting-1' },
      ]
    })
    Object.assign(request, {
      params: { userId: userUuid }
    })
    response.locals.user = user

    const settings = await user.settings

    const subject = new UsersController(
      updateUser,
      GetSettingsTest.makeSubject(settings),
    )
    const actual = await subject.getSettings(request, response)

    expect(actual.statusCode).toEqual(200)
    expect(actual.json).toEqual({
      userUuid,
      settings,
    })
  })

  it('shoud error when geting user settings for invaild user uuid', async () => {
    const userUuid = 'user-1'
    const badUserUuid = 'BAD-user-uuid'
    const user = UserTest.makeSubject({ 
      uuid: userUuid
    })
    Object.assign(request, {
      params: { userId: badUserUuid }
    })
    response.locals.user = user

    const actual = await createController().getSettings(request, response)

    expect(actual.statusCode).toEqual(401)
    expect(actual.json).toHaveProperty('error')
  })
})
