import { inject, injectable } from 'inversify'
import { GetSettingsDto } from './GetSettingsDto'
import { GetSettingsResponse } from './GetSettingsResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Setting } from '../../Setting/Setting'
import { MfaSetting } from '@standardnotes/auth'

@injectable()
export class GetSettings implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
  ) {}

  async execute(dto: GetSettingsDto): Promise<GetSettingsResponse> {
    const { userUuid } = dto
    const settings = await this.settingRepository.findAllByUserUuid(userUuid)
    const filteredSettings = settings.filter((setting: Setting) => setting.name !== MfaSetting.MfaSecret)
    const simpleSettings = await this.settingProjector.projectManySimple(filteredSettings)

    return {
      success: true,
      userUuid,
      settings: simpleSettings,
    }
  }
}
