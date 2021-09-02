import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { DeleteAccount } from '../Domain/UseCase/DeleteAccount/DeleteAccount'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'

@controller('/users')
export class UsersController extends BaseHttpController {
  constructor(
    @inject(TYPES.UpdateUser) private updateUser: UpdateUser,
    @inject(TYPES.GetUserFeatures) private doGetUserFeatures: GetUserFeatures,
    @inject(TYPES.GetUserKeyParams) private getUserKeyParams: GetUserKeyParams,
    @inject(TYPES.DeleteAccount) private doDeleteAccount: DeleteAccount,
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

  @httpGet('/:userUuid/features', TYPES.AuthMiddleware)
  async getFeatures(request: Request, response: Response): Promise<results.JsonResult> {
    if (request.params.userUuid !== response.locals.user.uuid) {
      return this.json({
        error: {
          message: 'Operation not allowed.',
        },
      }, 401)
    }

    const result = await this.doGetUserFeatures.execute({
      userUuid: request.params.userUuid,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }
}
