import { inject, injectable } from 'inversify'
import { GetMFASettingDto } from './GetMFASettingDto'
import { GetMFASettingResponse } from './GetMFASettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../../Setting/Settings'

@injectable()
export class GetMFASetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
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

    const simpleSetting = await this.settingProjector.projectSimple(setting)

    return {
      success: true,
      userUuid,
      setting: simpleSetting,
    }
  }
}
