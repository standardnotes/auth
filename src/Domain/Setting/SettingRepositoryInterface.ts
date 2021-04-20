import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingStatus } from './CreateOrReplaceSettingStatus'
import { Setting } from './Setting'

export interface SettingRepositoryInterface {
  findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined>
  findAllByUserUuid(userUuid: string): Promise<Setting[]>

  createOrReplace(setting: CreateOrReplaceSettingDto): Promise<CreateOrReplaceSettingStatus>
}
