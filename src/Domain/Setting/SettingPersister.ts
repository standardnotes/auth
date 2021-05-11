import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingStatus } from './CreateOrReplaceSettingStatus'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

@injectable()
export class SettingPersister {
  constructor(
    @inject(TYPES.SettingFactory) private factory: SettingFactory,
    @inject(TYPES.SettingRepository) public repository: SettingRepositoryInterface,
  ) {}

  async createOrReplace(dto: CreateOrReplaceSettingDto):
  Promise<CreateOrReplaceSettingStatus> {
    const { user, props } = dto

    const existing = await this.repository.findOneByNameAndUserUuid(props.name, user.uuid)

    if (existing === undefined) {
      await this.repository.save(await this.factory.create(props, user))

      return 'created'
    }

    await this.repository.save(await this.factory.createReplacement(existing, props))

    return 'replaced'
  }
}
