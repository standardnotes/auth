import { Setting } from './Setting'

export interface SettingRepositoryInterface {
  findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined>
  findAllByUserUuid(userUuid: string): Promise<Setting[]>

  save(setting: Setting): Promise<Setting>
  save(settings: Setting[]): Promise<Setting[]>
}
