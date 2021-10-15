import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'
import { AuthenticateOfflineSubscriptionToken } from '../Domain/UseCase/AuthenticateOfflineSubscriptionToken/AuthenticateOfflineSubscriptionToken'
import { CreateOfflineSubscriptionToken } from '../Domain/UseCase/CreateOfflineSubscriptionToken/CreateOfflineSubscriptionToken'

@controller('/offline')
export class OfflineController extends BaseHttpController {
  constructor(
    @inject(TYPES.GetUserFeatures) private doGetUserFeatures: GetUserFeatures,
    @inject(TYPES.CreateOfflineSubscriptionToken) private createOfflineSubscriptionToken: CreateOfflineSubscriptionToken,
    @inject(TYPES.AuthenticateOfflineSubscriptionToken) private authenticateToken: AuthenticateOfflineSubscriptionToken,
  ) {
    super()
  }

  @httpGet('/features', TYPES.OfflineUserAuthMiddleware)
  async getOfflineFeatures(_request: Request, response: Response): Promise<results.JsonResult> {
    const result = await this.doGetUserFeatures.execute({
      email: response.locals.offlineUserEmail,
      offlineFeaturesToken: response.locals.offlineFeaturesToken,
      offline: true,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpPost('/subscription-tokens')
  async createToken(request: Request): Promise<results.JsonResult> {
    if (!request.body.email) {
      return this.json({
        error: {
          tag: 'invalid-request',
          message: 'Invalid request parameters.',
        },
      }, 400)
    }

    await this.createOfflineSubscriptionToken.execute({
      userEmail: request.body.email,
    })

    return this.json({ success: true })
  }

  @httpPost('/subscription-tokens/:token/validate')
  async validate(request: Request): Promise<results.JsonResult> {
    if (!request.body.email) {
      return this.json({
        error: {
          tag: 'invalid-request',
          message: 'Invalid request parameters.',
        },
      }, 400)
    }

    const authenticateTokenResponse = await this.authenticateToken.execute({
      token: request.params.token,
      userEmail: request.body.email,
    })

    if (!authenticateTokenResponse.success) {
      return this.json({
        error: {
          tag: 'invalid-auth',
          message: 'Invalid login credentials.',
        },
      }, 401)
    }

    return this.json(authenticateTokenResponse)
  }
}
