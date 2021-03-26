import { inject, injectable } from 'inversify'
import { GetSettingsDto } from './GetSettingsDto'
import { GetSettingsResponse } from './GetSettingsResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'

@injectable()
export class GetSettings implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
  ) {}

  async execute(dto: GetSettingsDto): Promise<GetSettingsResponse> {
    const { userUuid } = dto
    const settings = await this.settingRepository.findAllByUserUuid(userUuid)
    return { userUuid, settings }
  }
}
