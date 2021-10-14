import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { SubscriptionTokenRepositoryInterface } from '../../Subscription/SubscriptionTokenRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { AuthenticateSubscriptionTokenDTO } from './AuthenticateSubscriptionTokenDTO'
import { AuthenticateSubscriptionTokenResponse } from './AuthenticateSubscriptionTokenResponse'

@injectable()
export class AuthenticateSubscriptionToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.SubscriptionTokenRepository) private subscriptionTokenRepository: SubscriptionTokenRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ){
  }

  async execute(dto: AuthenticateSubscriptionTokenDTO): Promise<AuthenticateSubscriptionTokenResponse> {
    const userUuid = await this.subscriptionTokenRepository.getUserUuidByToken(dto.token)
    if (userUuid === undefined) {
      return {
        success: false,
      }
    }

    const user = await this.userRepository.findOneByUuid(userUuid)
    if (user === undefined) {
      return {
        success: false,
      }
    }

    return {
      success: true,
      user,
    }
  }
}
