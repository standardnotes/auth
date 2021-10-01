import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { EphemeralTokenRepositoryInterface } from '../../Subscription/EphemeralTokenRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { AuthenticateTokenDTO } from './AuthenticateTokenDTO'
import { AuthenticateTokenResponse } from './AuthenticateTokenResponse'

@injectable()
export class AuthenticateToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.EphemeralTokenRepository) private ephemeralTokenRepository: EphemeralTokenRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ){
  }

  async execute(dto: AuthenticateTokenDTO): Promise<AuthenticateTokenResponse> {
    const userUuid = await this.ephemeralTokenRepository.getUserUuidByToken(dto.token)
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
