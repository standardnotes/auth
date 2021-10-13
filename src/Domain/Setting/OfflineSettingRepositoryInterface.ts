import { OfflineSetting } from './OfflineSetting'
import { OfflineSettingName } from './OfflineSettingName'

export interface OfflineSettingRepositoryInterface {
  findOneByNameAndEmail(name: OfflineSettingName, email: string): Promise<OfflineSetting | undefined>
  findOneByNameAndValue(name: OfflineSettingName, value: string): Promise<OfflineSetting | undefined>
  save(offlineSetting: OfflineSetting): Promise<OfflineSetting>
}
