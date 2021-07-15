import { ErrorTag, MfaSetting } from '@standardnotes/auth'
import { v4 as uuidv4 } from 'uuid'
import { inject, injectable } from 'inversify'
import { authenticator } from 'otplib'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { MFAValidationError } from '../Error/MFAValidationError'
import { ItemHttpServiceInterface } from '../Item/ItemHttpServiceInterface'
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
    @inject(TYPES.ItemHttpService) private itemHttpService: ItemHttpServiceInterface,
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

      const mfaSecretFromSettings = await this.getMFASecretFromUserSettings(user)
      if (mfaSecretFromSettings !== undefined) {
        this.logger.debug('Verifying secret from user settings')

        return this.verifyMFASecret(mfaSecretFromSettings, dto.requestParams)
      }

      const mfaSecretExtension = await this.itemHttpService.getUserMFASecret(user.uuid)
      if (mfaSecretExtension === undefined) {
        return {
          success: true,
        }
      }

      this.logger.debug('Verifying secret from MFA Extension')

      return this.verifyMFASecret(mfaSecretExtension.secret, dto.requestParams, mfaSecretExtension.extensionUuid)
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
      { mfa_key: `mfa_${uuidv4()}` }
    )
  }

  private async getMFASecretFromUserSettings(user: User): Promise<string | undefined> {
    const mfaSetting = await this.settingRepository.findLastByNameAndUserUuid(MfaSetting.MfaSecret, user.uuid)
    if (mfaSetting === undefined || mfaSetting.value === null) {
      return undefined
    }

    this.logger.debug('Found MFA Setting %O', mfaSetting)

    if (mfaSetting.serverEncryptionVersion === Setting.ENCRYPTION_VERSION_UNENCRYPTED) {
      return mfaSetting.value
    }

    const decrypted = await this.crypter.decryptForUser(mfaSetting.value, user)
    if (mfaSetting.serverEncryptionVersion !== Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED) {
      return decrypted
    }

    const decoded = this.contentDecoder.decode(decrypted)

    return decoded.secret as string
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
