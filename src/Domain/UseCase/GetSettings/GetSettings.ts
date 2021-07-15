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
  ) {
  }

  async execute(dto: GetSettingsDto): Promise<GetSettingsResponse> {
    const { userUuid } = dto
    let settings = await this.settingRepository.findAllByUserUuid(userUuid)

    if (dto.settingName !== undefined) {
      settings = settings.filter((setting: Setting) => setting.name === dto.settingName)
    }

    if (dto.updatedAfter !== undefined) {
      settings = settings.filter((setting: Setting) => setting.updatedAt > (dto.updatedAfter as number))
    }

    if (!dto.allowMFARetrieval) {
      settings = settings.filter((setting: Setting) => setting.name !== MfaSetting.MfaSecret)
    }

    const simpleSettings = await this.settingProjector.projectManySimple(settings)

    return {
      success: true,
      userUuid,
      settings: simpleSettings,
    }
  }
}
