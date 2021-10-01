import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { CreateEphemeralToken } from '../Domain/UseCase/CreateEphemeralToken/CreateEphemeralToken'

@controller('/tokens')
export class TokensController extends BaseHttpController {
  constructor(
    @inject(TYPES.CreateEphemeralToken) private createEphemeralToken: CreateEphemeralToken,
  ) {
    super()
  }

  @httpPost('/', TYPES.ApiGatewayAuthMiddleware)
  async createToken(_request: Request, response: Response): Promise<results.JsonResult> {
    const result = await this.createEphemeralToken.execute({
      userUuid: response.locals.user.uuid,
      email: response.locals.user.email,
    })

    return this.json(result.ephemeralToken)
  }
}
