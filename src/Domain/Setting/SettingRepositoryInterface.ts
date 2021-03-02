import { Setting } from './Setting'

export interface SettingRepositoryInterface {
  findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined>
}
