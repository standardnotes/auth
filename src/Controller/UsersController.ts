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
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'

@controller('/users', TYPES.AuthMiddleware)
export class UsersController extends BaseHttpController {
  constructor(
    @inject(TYPES.UpdateUser) private updateUser: UpdateUser,
    @inject(TYPES.GetSettings) private doGetSettings: GetSettings,
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

  @httpGet('/:userId/settings')
  async getSettings(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userId !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.'
        }
      }, 401)
    }

    const { userId } = request.params
    const result = await this.doGetSettings.execute({ userUuid: userId })

    return this.json(result)
  }
}
