import { SubscriptionName } from '@standardnotes/auth'
import { PermissionName } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

export interface SettingsAssociationServiceInterface {
  getDefaultSettingsAndValuesForSubscriptionName(subscriptionName: SubscriptionName): Promise<Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }> | undefined>
  getDefaultSettingsAndValuesForNewUser(): Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>
  getPermissionAssociatedWithSetting(settingName: SettingName): PermissionName | undefined
  getEncryptionVersionForSetting(settingName: SettingName): EncryptionVersion
  getSensitivityForSetting(settingName: SettingName): boolean
  isSettingMutableByClient(settingName: SettingName): boolean
  getFileUploadLimit(subscriptionName: SubscriptionName): Promise<number>
}
