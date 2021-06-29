import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

@injectable()
export class SettingService {
  constructor(
    @inject(TYPES.SettingFactory) private factory: SettingFactory,
    @inject(TYPES.SettingRepository) public repository: SettingRepositoryInterface,
  ) {}

  async createOrReplace(dto: CreateOrReplaceSettingDto):
  Promise<CreateOrReplaceSettingResponse> {
    const { user, props } = dto

    const existing = await this.repository.findOneByNameAndUserUuid(props.name, user.uuid)

    if (existing === undefined) {
      const setting = await this.repository.save(await this.factory.create(props, user))

      return {
        status: 'created',
        setting,
      }
    }

    const setting = await this.repository.save(await this.factory.createReplacement(existing, props))

    return {
      status: 'replaced',
      setting,
    }
  }
}
