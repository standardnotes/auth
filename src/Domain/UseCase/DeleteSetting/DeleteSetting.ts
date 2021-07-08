import { inject, injectable } from 'inversify'
import { DeleteSettingDto } from './DeleteSettingDto'
import { DeleteSettingResponse } from './DeleteSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class DeleteSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: DeleteSettingDto): Promise<DeleteSettingResponse> {
    const { userUuid, settingName } = dto

    const setting = await this.settingRepository
      .findOneByNameAndUserUuid(settingName, userUuid)

    if (setting === undefined) {
      return {
        success: false,
        error: {
          message: `Setting ${settingName} for user ${userUuid} not found.`,
        },
      }
    }

    if (dto.softDelete) {
      setting.value = null
      setting.updatedAt = this.timer.getTimestampInMicroseconds()

      await this.settingRepository.save(setting)
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
