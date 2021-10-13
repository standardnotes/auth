import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpGet,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'

@controller('/offline')
export class OfflineController extends BaseHttpController {
  constructor(
    @inject(TYPES.GetUserFeatures) private doGetUserFeatures: GetUserFeatures,
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
}
