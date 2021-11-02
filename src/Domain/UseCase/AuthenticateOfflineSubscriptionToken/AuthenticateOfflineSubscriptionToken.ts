import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { OfflineSubscriptionTokenRepositoryInterface } from '../../Auth/OfflineSubscriptionTokenRepositoryInterface'
import { OfflineSettingName } from '../../Setting/OfflineSettingName'
import { OfflineSettingRepositoryInterface } from '../../Setting/OfflineSettingRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { AuthenticateOfflineSubscriptionTokenDTO } from './AuthenticateOfflineSubscriptionTokenDTO'
import { AuthenticateOfflineSubscriptionTokenResponse } from './AuthenticateOfflineSubscriptionTokenResponse'

@injectable()
export class AuthenticateOfflineSubscriptionToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.OfflineSubscriptionTokenRepository) private offlineSubscriptionTokenRepository: OfflineSubscriptionTokenRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
    @inject(TYPES.OfflineSettingRepository) private offlineSettingRepository: OfflineSettingRepositoryInterface,
  ){
  }

  async execute(dto: AuthenticateOfflineSubscriptionTokenDTO): Promise<AuthenticateOfflineSubscriptionTokenResponse> {
    const userEmail = await this.offlineSubscriptionTokenRepository.getUserEmailByToken(dto.token)
    if (userEmail === undefined || userEmail !== dto.userEmail) {
      return {
        success: false,
      }
    }

    const subscriptions = await this.offlineUserSubscriptionRepository.findByEmail(userEmail, 0)
    if (subscriptions.length === 0) {
      return {
        success: false,
      }
    }

    const offlineFeaturesTokenSetting = await this.offlineSettingRepository.findOneByNameAndEmail(
      OfflineSettingName.FeaturesToken,
      userEmail,
    )
    if (offlineFeaturesTokenSetting === undefined) {
      return {
        success: false,
      }
    }

    return {
      success: true,
      email: userEmail,
      subscriptions,
      featuresToken: offlineFeaturesTokenSetting.value as string,
    }
  }
}
