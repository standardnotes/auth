import { Request } from 'express'
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

@controller('/internal')
export class InternalController extends BaseHttpController {
  constructor(
    @inject(TYPES.GetUserFeatures) private doGetUserFeatures: GetUserFeatures,
  ) {
    super()
  }

  @httpGet('/users/:userUuid/features')
  async getFeatures(request: Request): Promise<results.JsonResult> {
    const result = await this.doGetUserFeatures.execute({
      userUuid: request.params.userUuid,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }
}
