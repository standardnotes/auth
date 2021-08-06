import { ErrorTag } from '@standardnotes/common'
import { SettingName } from '@standardnotes/settings'
import { v4 as uuidv4 } from 'uuid'
import { inject, injectable } from 'inversify'
import { authenticator } from 'otplib'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { MFAValidationError } from '../Error/MFAValidationError'
import { Setting } from '../Setting/Setting'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UseCaseInterface } from './UseCaseInterface'
import { VerifyMFADTO } from './VerifyMFADTO'
import { VerifyMFAResponse } from './VerifyMFAResponse'
import { ContentDecoderInterface } from '../Encryption/ContentDecoderInterface'

@injectable()
export class VerifyMFA implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.ContenDecoder) private contentDecoder: ContentDecoderInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async execute(dto: VerifyMFADTO): Promise<VerifyMFAResponse> {
    try {
      const user = await this.userRepository.findOneByEmail(dto.email)
      if (user == undefined) {
        return {
          success: true,
        }
      }

      const mfaSecret = await this.getMFASecret(user)
      if (mfaSecret === undefined) {
        return {
          success: true,
        }
      }

      return this.verifyMFASecret(mfaSecret, dto.requestParams)
    } catch (error) {
      if (error instanceof MFAValidationError) {
        return {
          success: false,
          errorTag: error.tag,
          errorMessage: error.message,
          errorPayload: error.payload,
        }
      }

      throw error
    }
  }

  private getMFATokenAndParamKeyFromRequestParams(requestParams: Record<string, unknown>): { key: string, token: string } {
    let mfaParamKey = null
    for (const key of Object.keys(requestParams)) {
      if (key.startsWith('mfa_')) {
        mfaParamKey = key
        break
      }
    }

    if (mfaParamKey === null) {
      throw new MFAValidationError(
        'Please enter your two-factor authentication code.',
        ErrorTag.MfaRequired,
        { mfa_key: `mfa_${uuidv4()}` }
      )
    }

    return {
      token: requestParams[mfaParamKey] as string,
      key: mfaParamKey,
    }
  }

  private async getMFASecret(user: User): Promise<string | undefined> {
    const mfaSetting = await this.settingRepository.findLastByNameAndUserUuid(SettingName.MfaSecret, user.uuid)
    if (mfaSetting === undefined || mfaSetting.value === null) {
      return undefined
    }

    this.logger.debug('Found MFA Setting %O', mfaSetting)

    let decrypted = mfaSetting.value

    const encryptedVersions = [
      Setting.ENCRYPTION_VERSION_DEFAULT,
      Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
    ]

    if (encryptedVersions.includes(mfaSetting.serverEncryptionVersion)) {
      decrypted = await this.crypter.decryptForUser(mfaSetting.value, user)
    }

    const decoded = this.contentDecoder.decode(decrypted)

    return decoded.secret as string
  }

  private verifyMFASecret(secret: string, requestParams: Record<string, unknown>): VerifyMFAResponse {
    const tokenAndParamKey = this.getMFATokenAndParamKeyFromRequestParams(requestParams)

    if (!authenticator.verify({ token: tokenAndParamKey.token, secret })) {
      throw new MFAValidationError(
        'The two-factor authentication code you entered is incorrect. Please try again.',
        ErrorTag.MfaInvalid,
        { mfa_key: tokenAndParamKey.key }
      )
    }

    return {
      success: true,
    }
  }
}
