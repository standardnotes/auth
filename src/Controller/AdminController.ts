import { SettingName } from '@standardnotes/settings'
import { Request } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpDelete,
  httpGet,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { CreateSubscriptionToken } from '../Domain/UseCase/CreateSubscriptionToken/CreateSubscriptionToken'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'
import { UserRepositoryInterface } from '../Domain/User/UserRepositoryInterface'

@controller('/admin')
export class AdminController extends BaseHttpController {
  constructor(
    @inject(TYPES.DeleteSetting) private doDeleteSetting: DeleteSetting,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.CreateSubscriptionToken) private createSubscriptionToken: CreateSubscriptionToken,
  ) {
    super()
  }

  @httpGet('/user/:email')
  async getUser(request: Request): Promise<results.JsonResult> {
    const email = 'email' in request.params ? <string> request.params.email : undefined

    if(!email) {
      return this.json({
        error: {
          message: 'Missing email parameter.',
        },
      }, 400)
    }

    const user = await this.userRepository.findOneByEmail(email)

    if (!user) {
      return this.json({
        error: {
          message: `No user with email '${email}'.`,
        },
      }, 400)
    }

    return this.json({
      uuid: user.uuid,
    })
  }

  @httpDelete('/users/:userUuid/mfa',)
  async deleteMFASetting(request: Request): Promise<results.JsonResult> {
    const { userUuid } = request.params
    const { uuid, updatedAt } = request.body

    const result = await this.doDeleteSetting.execute({
      uuid,
      userUuid,
      settingName: SettingName.MfaSecret,
      timestamp: updatedAt,
      softDelete: true,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpPost('/users/:userUuid/subscription-token')
  async createToken(request: Request): Promise<results.JsonResult> {
    const { userUuid } = request.params
    const result = await this.createSubscriptionToken.execute({
      userUuid,
    })

    return this.json({
      token: result.subscriptionToken.token,
    })
  }
}
