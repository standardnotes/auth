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
import { sign } from 'jsonwebtoken'

@controller('/offline')
export class OfflineController extends BaseHttpController {
  constructor(
    @inject(TYPES.GetUserFeatures) private doGetUserFeatures: GetUserFeatures,
    @inject(TYPES.CreateOfflineSubscriptionToken) private createOfflineSubscriptionToken: CreateOfflineSubscriptionToken,
    @inject(TYPES.AuthenticateOfflineSubscriptionToken) private authenticateToken: AuthenticateOfflineSubscriptionToken,
    @inject(TYPES.AUTH_JWT_SECRET) private jwtSecret: string,
    @inject(TYPES.AUTH_JWT_TTL) private jwtTTL: number,
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

    const response = await this.createOfflineSubscriptionToken.execute({
      userEmail: request.body.email,
    })

    if (!response.success) {
      return this.json({ success: false, error: { tag: response.error } })
    }

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

    const offlineAuthTokenData = {
      userEmail: authenticateTokenResponse.email,
      featuresToken: authenticateTokenResponse.featuresToken,
    }

    const authToken = sign(offlineAuthTokenData, this.jwtSecret, { algorithm: 'HS256', expiresIn: this.jwtTTL })

    return this.json({ authToken })
  }
}
