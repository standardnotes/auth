import { inject, injectable } from 'inversify'
import { GetSettingDto } from './GetSettingDto'
import { GetSettingResponse } from './GetSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'

@injectable()
export class GetSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
  ) {}

  async execute(dto: GetSettingDto): Promise<GetSettingResponse> {
    const { userUuid, settingName } = dto
    const setting = await this.settingRepository.findOneByNameAndUserUuid(settingName, userUuid)
    
    if (setting === undefined) {
      return {
        success: false,
        error: `Setting ${settingName} for user ${userUuid} not found!`,
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
