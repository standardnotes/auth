import { inject, injectable } from 'inversify'
import { authenticator } from 'otplib'
import TYPES from '../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../Setting/Settings'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UseCaseInterface } from './UseCaseInterface'
import { VerifyMFADTO } from './VerifyMFADTO'
import { VerifyMFAResponse } from './VerifyMFAResponse'

@injectable()
export class VerifyMFA implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface
  ) {
  }

  async execute(dto: VerifyMFADTO): Promise<VerifyMFAResponse> {
    const user = await this.userRepository.findOneByEmail(dto.email)
    if(!user) {
      return {
        success: false,
        errorMessage: 'Invalid email or password'
      }
    }

    const mfaSecret = await this.settingRepository.findOneByNameAndUserUuid(SETTINGS.MFA_SECRET, user.uuid)

    if (!mfaSecret) {
      return {
        success: true
      }
    }

    if (!dto.token) {
      return {
        success: false,
        errorTag: 'mfa-required',
        errorMessage: 'Please enter your two-factor authentication code.'
      }
    }

    if (!authenticator.verify({ token: dto.token, secret: mfaSecret.value })) {
      return {
        success: false,
        errorTag: 'mfa-invalid',
        errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.'
      }
    }

    return {
      success: true
    }
  }
}
