import 'reflect-metadata'

import { AdminController } from './AdminController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { UserRepositoryInterface } from '../Domain/User/UserRepositoryInterface'
import * as express from 'express'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'

describe('AdminController', () => {
  let deleteSetting: DeleteSetting
  let userRepository: UserRepositoryInterface
  let request: express.Request
  let user: User

  const createController = () => new AdminController(
    deleteSetting,
    userRepository,
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    user.uuid = '123'

    deleteSetting = {} as jest.Mocked<DeleteSetting>
    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

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
})
