import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

@injectable()
export class SettingService {
  constructor(
    @inject(TYPES.SettingFactory) private factory: SettingFactory,
    @inject(TYPES.SettingRepository) private repository: SettingRepositoryInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async createOrReplace(dto: CreateOrReplaceSettingDto): Promise<CreateOrReplaceSettingResponse> {
    const { user, props } = dto

    const existing = await this.getSetting(dto)

    if (existing === undefined) {
      const setting = await this.repository.save(await this.factory.create(props, user))

      this.logger.debug('[%s] Created setting %s: %O', user.uuid, props.name, setting)

      return {
        status: 'created',
        setting,
      }
    }

    const setting = await this.repository.save(await this.factory.createReplacement(existing, props))

    this.logger.debug('[%s] Replaced existing setting %s with: %O', user.uuid, props.name, setting)

    return {
      status: 'replaced',
      setting,
    }
  }

  private async getSetting(dto: CreateOrReplaceSettingDto): Promise<Setting | undefined> {
    const { user, props } = dto

    if (props.uuid !== undefined) {
      return this.repository.findOneByUuid(props.uuid)
    } else {
      return this.repository.findLastByNameAndUserUuid(props.name, user.uuid)
    }
  }
}
