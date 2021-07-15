import { inject, injectable } from 'inversify'
import { GetSettingDto } from './GetSettingDto'
import { GetSettingResponse } from './GetSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { MfaSetting } from '@standardnotes/auth'
import { CrypterInterface } from '../../Encryption/CrypterInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { Setting } from '../../Setting/Setting'

@injectable()
export class GetSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
  ) {
  }

  async execute(dto: GetSettingDto): Promise<GetSettingResponse> {
    const { userUuid, settingName } = dto

    if (settingName === MfaSetting.MfaSecret && !dto.allowMFARetrieval) {
      return {
        success: false,
        error: {
          message: `Setting ${settingName} for user ${userUuid} not found!`,
        },
      }
    }

    const setting = await this.settingRepository.findLastByNameAndUserUuid(settingName, userUuid)

    if (setting === undefined) {
      return {
        success: false,
        error: {
          message: `Setting ${settingName} for user ${userUuid} not found!`,
        },
      }
    }

    if (setting.value !== null &&
      (
        setting.serverEncryptionVersion === Setting.ENCRYPTION_VERSION_DEFAULT ||
        setting.serverEncryptionVersion === Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED
      )
    ) {
      const user = await this.userRepository.findOneByUuid(userUuid)

      if (user === undefined) {
        return {
          success: false,
          error: {
            message: `User ${userUuid} not found.`,
          },
        }
      }

      setting.value = await this.crypter.decryptForUser(setting.value, user)
    }

    const simpleSetting = await this.settingProjector.projectSimple(setting)

    return {
      success: true,
      userUuid,
      setting: simpleSetting,
    }
  }
}
