import { ErrorTag } from '@standardnotes/auth'
import { inject, injectable } from 'inversify'
import { authenticator } from 'otplib'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { MFAValidationError } from '../Error/MFAValidationError'
import { ContentDecoderInterface } from '../Item/ContentDecoderInterface'
import { Item } from '../Item/Item'
import { ItemRepositoryInterface } from '../Item/ItemRepositoryInterface'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../Setting/Settings'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UseCaseInterface } from './UseCaseInterface'
import { VerifyMFADTO } from './VerifyMFADTO'
import { VerifyMFAResponse } from './VerifyMFAResponse'

@injectable()
export class VerifyMFA implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.ItemRepository) private itemsRepository: ItemRepositoryInterface,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.ContentDecoder) private contentDecoder: ContentDecoderInterface,
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

      const mfaSecretFromSettings = await this.getMFASecretFromUserSettings(user)
      if (mfaSecretFromSettings !== undefined) {
        return this.verifyMFASecret(mfaSecretFromSettings, dto.requestParams)
      }

      const mfaExtension = await this.itemsRepository.findMFAExtensionByUserUuid(user.uuid)
      if (!mfaExtension || mfaExtension.deleted) {
        return {
          success: true,
        }
      }

      const mfaSecretFromExtension = this.getMFASecretFromExtension(mfaExtension)

      return this.verifyMFASecret(mfaSecretFromExtension, dto.requestParams, mfaExtension.uuid)
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

  private getMFATokenFromRequestParams(requestParams: Record<string, unknown>, mfaExtensionUuid?: string): string {
    const mfaParamKey = this.getMFAParameterNameFromRequest(requestParams, mfaExtensionUuid)

    if (requestParams[mfaParamKey] === undefined) {
      throw new MFAValidationError(
        'Please enter your two-factor authentication code.',
        ErrorTag.MfaRequired,
        { mfa_key: mfaParamKey }
      )
    }

    return requestParams[mfaParamKey] as string
  }

  private getMFAParameterNameFromRequest(requestParams: Record<string, unknown>, mfaExtensionUuid?: string): string {
    if (mfaExtensionUuid !== undefined) {
      return `mfa_${mfaExtensionUuid}`
    }

    for (const key of Object.keys(requestParams)) {
      if (key.startsWith('mfa_')) {
        return key
      }
    }

    throw new MFAValidationError(
      'Please enter your two-factor authentication code.',
      ErrorTag.MfaRequired,
    )
  }

  private async getMFASecretFromUserSettings(user: User): Promise<string | undefined> {
    const mfaSetting = await this.settingRepository.findOneByNameAndUserUuid(SETTINGS.MFA_SECRET, user.uuid)
    if (mfaSetting === undefined) {
      return undefined
    }

    return this.crypter.decryptForUser(mfaSetting.value, user)
  }

  private getMFASecretFromExtension(mfaExtension: Item): string {
    const mfaContent = this.contentDecoder.decode(<string> mfaExtension.content)

    return mfaContent.secret as string
  }

  private verifyMFASecret(secret: string, requestParams: Record<string, unknown>, mfaExtensionUuid?: string): VerifyMFAResponse {
    const token = this.getMFATokenFromRequestParams(requestParams, mfaExtensionUuid)

    if (!authenticator.verify({ token, secret })) {
      const mfaParamKey = this.getMFAParameterNameFromRequest(requestParams, mfaExtensionUuid)

      throw new MFAValidationError(
        'The two-factor authentication code you entered is incorrect. Please try again.',
        ErrorTag.MfaInvalid,
        { mfa_key: mfaParamKey }
      )
    }

    return {
      success: true,
    }
  }
}
