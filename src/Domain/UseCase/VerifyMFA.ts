import { ErrorTag } from '@standardnotes/common'
import { SettingName } from '@standardnotes/settings'
import { v4 as uuidv4 } from 'uuid'
import { inject, injectable } from 'inversify'
import { authenticator } from 'otplib'
import TYPES from '../../Bootstrap/Types'
import { MFAValidationError } from '../Error/MFAValidationError'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UseCaseInterface } from './UseCaseInterface'
import { VerifyMFADTO } from './VerifyMFADTO'
import { VerifyMFAResponse } from './VerifyMFAResponse'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

@injectable()
export class VerifyMFA implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
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

      const mfaSecret = await this.settingService.findSetting({
        userUuid: user.uuid,
        settingName: SettingName.MfaSecret,
      })
      if (mfaSecret === undefined || mfaSecret.value === null) {
        return {
          success: true,
        }
      }

      return this.verifyMFASecret(mfaSecret.value, dto.requestParams)
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
