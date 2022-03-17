import { SubscriptionName } from '@standardnotes/common'
import { PermissionName } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { SettingDescription } from './SettingDescription'

export interface SettingsAssociationServiceInterface {
  getDefaultSettingsAndValuesForSubscriptionName(subscriptionName: SubscriptionName): Promise<Map<SettingName, SettingDescription> | undefined>
  getDefaultSettingsAndValuesForNewUser(): Map<SettingName, SettingDescription>
  getDefaultSettingsAndValuesForNewVaultAccount(): Map<SettingName, SettingDescription>
  getPermissionAssociatedWithSetting(settingName: SettingName): PermissionName | undefined
  getEncryptionVersionForSetting(settingName: SettingName): EncryptionVersion
  getSensitivityForSetting(settingName: SettingName): boolean
  isSettingMutableByClient(settingName: SettingName): boolean
  getFileUploadLimit(subscriptionName: SubscriptionName): Promise<number>
}
