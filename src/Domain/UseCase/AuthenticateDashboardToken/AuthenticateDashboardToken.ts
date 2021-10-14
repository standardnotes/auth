import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { DashboardTokenRepositoryInterface } from '../../Auth/DashboardTokenRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { AuthenticateDashboardTokenDTO } from './AuthenticateDashboardTokenDTO'
import { AuthenticateDashboardTokenResponse } from './AuthenticateDashboardTokenResponse'

@injectable()
export class AuthenticateDashboardToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.DashboardTokenRepository) private dashboardTokenRepository: DashboardTokenRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
  ){
  }

  async execute(dto: AuthenticateDashboardTokenDTO): Promise<AuthenticateDashboardTokenResponse> {
    const userEmail = await this.dashboardTokenRepository.getUserEmailByToken(dto.token)
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

    return {
      success: true,
      email: userEmail,
      subscriptions,
    }
  }
}
