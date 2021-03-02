import { Setting } from './Setting'

export interface SettingRepositoryInterface {
  findOneByName(name: string): Promise<Setting | undefined>
}
