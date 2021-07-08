import { inject, injectable } from 'inversify'
import { GetMFASettingDto } from './GetMFASettingDto'
import { GetMFASettingResponse } from './GetMFASettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../../Setting/Settings'
import { CrypterInterface } from '../../Encryption/CrypterInterface'
import { Setting } from '../../Setting/Setting'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'

@injectable()
export class GetMFASetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
  ) {}

  async execute(dto: GetMFASettingDto): Promise<GetMFASettingResponse> {
    const { userUuid } = dto

    const setting = await this.settingRepository.findOneByNameAndUserUuid(SETTINGS.MFA_SECRET, userUuid)

    if (setting === undefined) {
      return {
        success: false,
        error: {
          message: `Setting ${SETTINGS.MFA_SECRET} for user ${userUuid} not found!`,
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
