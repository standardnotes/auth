import { ReadStream } from 'fs'

import { SettingName } from '@standardnotes/settings'
import { DeleteSettingDto } from '../UseCase/DeleteSetting/DeleteSettingDto'
import { Setting } from './Setting'

export interface SettingRepositoryInterface {
  findOneByUuid(uuid: string): Promise<Setting | undefined>
  findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined>
  findLastByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined>
  findAllByUserUuid(userUuid: string): Promise<Setting[]>
  streamAllByNameAndValue(name: SettingName, value: string): Promise<ReadStream>
  deleteByUserUuid(dto: DeleteSettingDto): Promise<void>
  save(setting: Setting): Promise<Setting>
}
