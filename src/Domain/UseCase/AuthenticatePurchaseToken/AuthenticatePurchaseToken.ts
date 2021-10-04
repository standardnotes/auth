import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { PurchaseTokenRepositoryInterface } from '../../Subscription/PurchaseTokenRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { AuthenticatePurchaseTokenDTO } from './AuthenticatePurchaseTokenDTO'
import { AuthenticatePurchaseTokenResponse } from './AuthenticatePurchaseTokenResponse'

@injectable()
export class AuthenticatePurchaseToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.PurchaseTokenRepository) private purchaseTokenRepository: PurchaseTokenRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ){
  }

  async execute(dto: AuthenticatePurchaseTokenDTO): Promise<AuthenticatePurchaseTokenResponse> {
    const userUuid = await this.purchaseTokenRepository.getUserUuidByToken(dto.token)
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
