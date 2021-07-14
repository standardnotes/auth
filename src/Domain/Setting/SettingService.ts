import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
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

    const existing = await this.repository.findOneByNameAndUserUuid(props.name, user.uuid)

    if (existing === undefined) {
      const setting = await this.repository.save(await this.factory.create(props, user))

      this.logger.debug('Created setting %s: %O', props.name, setting)

      return {
        status: 'created',
        setting,
      }
    }

    const setting = await this.repository.save(await this.factory.createReplacement(existing, props))

    this.logger.debug('Replaced existing setting %s with: %O', props.name, setting)

    return {
      status: 'replaced',
      setting,
    }
  }
}
