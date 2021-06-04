import { inject, injectable } from 'inversify'
import { GetSettingDto } from './GetSettingDto'
import { GetSettingResponse } from './GetSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../../Setting/Settings'

@injectable()
export class GetSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
  ) {}

  async execute(dto: GetSettingDto): Promise<GetSettingResponse> {
    const { userUuid, settingName } = dto

    if (settingName === SETTINGS.MFA_SECRET) {
      return {
        success: false,
        error: {
          message: `Setting ${settingName} for user ${userUuid} not found!`,
        },
      }
    }

    const setting = await this.settingRepository.findOneByNameAndUserUuid(settingName, userUuid)

    if (setting === undefined) {
      return {
        success: false,
        error: {
          message: `Setting ${settingName} for user ${userUuid} not found!`,
        },
      }
    }

    const simpleSetting = await this.settingProjector.projectSimple(setting)

    return {
      success: true,
      userUuid,
      setting: simpleSetting,
    }
  }
}
