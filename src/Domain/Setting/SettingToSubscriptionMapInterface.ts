import { SubscriptionName } from '@standardnotes/auth'
import { PermissionName } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'

export interface SettingToSubscriptionMapInterface {
  getDefaultSettingsAndValuesForSubscriptionName(subscriptionName: SubscriptionName): Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }> | undefined
  getPermissionAssociatedWithSetting(settingName: SettingName): PermissionName | undefined
}
