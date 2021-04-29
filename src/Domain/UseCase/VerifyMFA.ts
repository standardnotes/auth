import { inject, injectable } from 'inversify'
import { authenticator } from 'otplib'
import TYPES from '../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../Setting/Settings'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UseCaseInterface } from './UseCaseInterface'
import { VerifyMFADTO } from './VerifyMFADTO'
import { VerifyMFAResponse } from './VerifyMFAResponse'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { ErrorTag } from '@standardnotes/auth'

@injectable()
export class VerifyMFA implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface
  ) {
  }

  async execute(dto: VerifyMFADTO): Promise<VerifyMFAResponse> {
    const user = await this.userRepository.findOneByEmail(dto.email)
    if (user === undefined) {
      return {
        success: true,
      }
    }

    const mfaSecretSetting = await this.settingRepository.findOneByNameAndUserUuid(SETTINGS.MFA_SECRET, user.uuid)

    if (!mfaSecretSetting) {
      return {
        success: true,
      }
    }

    // assuming mfaPayload is always set here -- this should be ensured by validation in AuthController

    if (!dto.token) {
      return {
        success: false,
        errorTag: ErrorTag.MfaRequired,
        errorMessage: 'Please enter your two-factor authentication code.',
      }
    }

    // hm: it seems that this assumes that there is only one mfa setting per user and it isn't looked up by uuid -- instead the user is the key (or more precisely [user, settingName]) 
    const decryptedValue = await this.crypter.decryptForUser(mfaSecretSetting.value, user)
    if (!decryptedValue || !authenticator.verify({ token: dto.token, secret: decryptedValue })) {
      return {
        success: false,
        errorTag: ErrorTag.MfaInvalid,
        errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.',
      }
    }

    return {
      success: true,
    }
  }
}
