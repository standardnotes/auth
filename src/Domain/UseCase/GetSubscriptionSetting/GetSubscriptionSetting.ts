import { inject, injectable } from 'inversify'

import { GetSubscriptionSettingDTO } from './GetSubscriptionSettingDTO'
import { GetSubscriptionSettingResponse } from './GetSubscriptionSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SubscriptionSettingServiceInterface } from '../../Setting/SubscriptionSettingServiceInterface'
import { UserSubscriptionServiceInterface } from '../../Subscription/UserSubscriptionServiceInterface'
import { SubscriptionSettingProjector } from '../../../Projection/SubscriptionSettingProjector'

@injectable()
export class GetSubscriptionSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.UserSubscriptionService) private userSubscriptionService: UserSubscriptionServiceInterface,
    @inject(TYPES.SubscriptionSettingService) private subscriptionSettingService: SubscriptionSettingServiceInterface,
    @inject(TYPES.SubscriptionSettingProjector) private subscriptionSettingProjector: SubscriptionSettingProjector,
  ) {
  }

  async execute(dto: GetSubscriptionSettingDTO): Promise<GetSubscriptionSettingResponse> {
    const userSubscription = await this.userSubscriptionService.findRegularSubscriptionForUserUuid(dto.userUuid)
    if (userSubscription === undefined) {
      return {
        success: false,
        error: {
          message: 'No subscription found.',
        },
      }
    }

    const regularSubscriptionUser = await userSubscription.user

    const setting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: regularSubscriptionUser.uuid,
      userSubscriptionUuid: userSubscription.uuid,
      subscriptionSettingName: dto.subscriptionSettingName,
    })

    if (setting === undefined) {
      return {
        success: false,
        error: {
          message: `Setting ${dto.subscriptionSettingName} for user ${dto.userUuid} not found!`,
        },
      }
    }

    if (setting.sensitive && !dto.allowSensitiveRetrieval) {
      return {
        success: true,
        sensitive: true,
      }
    }

    const simpleSetting = await this.subscriptionSettingProjector.projectSimple(setting)

    return {
      success: true,
      setting: simpleSetting,
    }
  }
}
