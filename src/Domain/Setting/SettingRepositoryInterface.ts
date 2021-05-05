import { DeleteSettingDto } from '../UseCase/DeleteSetting/DeleteSettingDto'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingStatus } from './CreateOrReplaceSettingStatus'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'

export interface SettingRepositoryInterface {
  findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined>
  findAllByUserUuid(userUuid: string): Promise<Setting[]>

  createOrReplace(dto: CreateOrReplaceSettingDto, settingFactory: SettingFactory): Promise<CreateOrReplaceSettingStatus>

  deleteByUserUuid(dto: DeleteSettingDto): Promise<void>
}
