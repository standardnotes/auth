import { inject, injectable } from 'inversify'
import { DeleteSettingDto } from './DeleteSettingDto'
import { DeleteSettingResponse } from './DeleteSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'

@injectable()
export class DeleteSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
  ) {}

  async execute(dto: DeleteSettingDto): Promise<DeleteSettingResponse> {
    const { userUuid, settingName } = dto

    const setting = await this.settingRepository
      .findOneByNameAndUserUuid(settingName, userUuid)

    if (setting === undefined) {
      return {
        success: false,
        error: `Setting ${settingName} for user ${userUuid} not found.`,
      }
    }
    
    await this.settingRepository.deleteByUserUuid({
      userUuid,
      settingName,
    })

    return { 
      success: true,
      settingName,
      userUuid,
    }
  }
}
