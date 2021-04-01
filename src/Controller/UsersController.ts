import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPatch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'

@controller('/users', TYPES.AuthMiddleware)
export class UsersController extends BaseHttpController {
  constructor(
    @inject(TYPES.UpdateUser) private updateUser: UpdateUser,
    @inject(TYPES.GetSettings) private doGetSettings: GetSettings,
    @inject(TYPES.GetSetting) private doGetSetting: GetSetting,
  ) {
    super()
  }

  @httpPatch('/:userId')
  async update(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userId !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.'
        }
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

  @httpGet('/:userUuid/settings')
  async getSettings(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.'
        }
      }, 401)
    }

    const { userUuid } = request.params
    const result = await this.doGetSettings.execute({ userUuid })

    return this.json(result)
  }

  @httpGet('/:userUuid/settings/:settingName')
  async getSetting(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.'
        }
      }, 401)
    }

    const { userUuid, settingName } = request.params
    const result = await this.doGetSetting.execute({ userUuid, settingName })

    if (result.success) return this.json(result)

    return this.json(result, 400)
  }
}
