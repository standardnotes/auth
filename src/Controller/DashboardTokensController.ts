import { Request } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'

import TYPES from '../Bootstrap/Types'
import { AuthenticateDashboardToken } from '../Domain/UseCase/AuthenticateDashboardToken/AuthenticateDashboardToken'
import { CreateDashboardToken } from '../Domain/UseCase/CreateDashboardToken/CreateDashboardToken'

@controller('/dashboard-tokens')
export class DashboardTokensController extends BaseHttpController {
  constructor(
    @inject(TYPES.CreateDashboardToken) private createDashboardToken: CreateDashboardToken,
    @inject(TYPES.AuthenticateDashboardToken) private authenticateToken: AuthenticateDashboardToken,
  ) {
    super()
  }

  @httpPost('/')
  async createToken(request: Request): Promise<results.JsonResult> {
    if (!request.body.email) {
      return this.json({
        error: {
          tag: 'invalid-request',
          message: 'Invalid request parameters.',
        },
      }, 400)
    }

    await this.createDashboardToken.execute({
      userEmail: request.body.email,
    })

    return this.json({ success: true })
  }

  @httpPost('/:token/validate')
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
