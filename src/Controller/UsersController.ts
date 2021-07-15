import { MfaSetting } from '@standardnotes/auth'
import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPut,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { Setting } from '../Domain/Setting/Setting'
import { DeleteAccount } from '../Domain/UseCase/DeleteAccount/DeleteAccount'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { UpdateSetting } from '../Domain/UseCase/UpdateSetting/UpdateSetting'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'

@controller('/users')
export class UsersController extends BaseHttpController {
  constructor(
    @inject(TYPES.UpdateUser) private updateUser: UpdateUser,
    @inject(TYPES.GetSettings) private doGetSettings: GetSettings,
    @inject(TYPES.GetSetting) private doGetSetting: GetSetting,
    @inject(TYPES.GetUserKeyParams) private getUserKeyParams: GetUserKeyParams,
    @inject(TYPES.UpdateSetting) private doUpdateSetting: UpdateSetting,
    @inject(TYPES.DeleteAccount) private doDeleteAccount: DeleteAccount,
    @inject(TYPES.DeleteSetting) private doDeleteSetting: DeleteSetting,
  ) {
    super()
  }

  @httpPatch('/:userId', TYPES.AuthMiddleware)
  async update(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userId !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.',
        },
      }, 401)
    }

    const updateResult = await this.updateUser.execute({
      user: response.locals.user,
      updatedWithUserAgent: <string> request.headers['user-agent'],
      apiVersion: request.body.api,
      pwFunc: request.body.pw_func,
      pwAlg: request.body.pw_alg,
      pwCost: request.body.pw_cost,
      pwKeySize: request.body.pw_key_size,
      pwNonce: request.body.pw_nonce,
      pwSalt: request.body.pw_salt,
      kpOrigination: request.body.origination,
      kpCreated: request.body.created,
      version: request.body.version,
    })

    return this.json(updateResult.authResponse)
  }

  @httpGet('/:userUuid/settings', TYPES.AuthMiddleware)
  async getSettings(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.',
        },
      }, 401)
    }

    const { userUuid } = request.params
    const result = await this.doGetSettings.execute({ userUuid })

    return this.json(result)
  }

  @httpGet('/:userUuid/mfa')
  async getMFASetting(request: Request): Promise<results.JsonResult> {
    const result = await this.doGetSetting.execute({
      userUuid: request.params.userUuid,
      settingName: MfaSetting.MfaSecret,
      allowMFARetrieval: true,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpDelete('/:userUuid/mfa',)
  async deleteMFASetting(request: Request): Promise<results.JsonResult> {
    const { userUuid } = request.params
    const { uuid, updatedAt } = request.body

    const result = await this.doDeleteSetting.execute({
      uuid,
      userUuid,
      settingName: MfaSetting.MfaSecret,
      timestamp: updatedAt,
      softDelete: true,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpPut('/:userUuid/mfa')
  async updateMFASetting(request: Request): Promise<results.JsonResult | results.StatusCodeResult> {
    const {
      uuid,
      value,
      serverEncryptionVersion = Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
      createdAt,
      updatedAt,
    } = request.body

    const props = {
      uuid,
      value,
      serverEncryptionVersion,
      name: MfaSetting.MfaSecret,
      createdAt,
      updatedAt,
    }

    const { userUuid } = request.params
    const result = await this.doUpdateSetting.execute({
      userUuid,
      props,
    })

    if (result.success) {
      return this.json({ setting: result.setting }, result.statusCode)
    }

    return this.json(result, 400)
  }

  @httpGet('/:userUuid/settings/:settingName', TYPES.AuthMiddleware)
  async getSetting(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.',
        },
      }, 401)
    }

    const { userUuid, settingName } = request.params
    const result = await this.doGetSetting.execute({ userUuid, settingName })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpPut('/:userUuid/settings', TYPES.AuthMiddleware)
  async updateSetting(request: Request, response: Response): Promise<results.JsonResult | results.StatusCodeResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.',
        },
      }, 401)
    }

    const {
      name,
      value,
      serverEncryptionVersion = Setting.ENCRYPTION_VERSION_DEFAULT,
    } = request.body

    const props = {
      name,
      value,
      serverEncryptionVersion,
    }

    const { userUuid } = request.params
    const result = await this.doUpdateSetting.execute({
      userUuid,
      props,
    })

    if (result.success) {
      return this.json({ setting: result.setting }, result.statusCode)
    }

    return this.json(result, 400)
  }

  @httpDelete('/:userUuid/settings/:settingName', TYPES.AuthMiddleware)
  async deleteSetting(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.',
        },
      }, 401)
    }

    const { userUuid, settingName } = request.params

    const result = await this.doDeleteSetting.execute({
      userUuid,
      settingName,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpGet('/params')
  async keyParams(request: Request): Promise<results.JsonResult> {
    const email = 'email' in request.query ? <string> request.query.email : undefined
    const userUuid = 'uuid' in request.query ? <string> request.query.uuid : undefined

    if(!email && !userUuid) {
      return this.json({
        error: {
          message: 'Missing mandatory request query parameters.',
        },
      }, 400)
    }

    const result = await this.getUserKeyParams.execute({
      email,
      userUuid,
      authenticated: request.query.authenticated === 'true',
    })

    return this.json(result.keyParams)
  }

  @httpDelete('/:email')
  async deleteAccount(request: Request): Promise<results.JsonResult> {
    const result = await this.doDeleteAccount.execute({
      email: request.params.email,
    })

    return this.json({ message: result.message }, result.responseCode)
  }
}
