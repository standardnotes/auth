import { SubscriptionName } from '@standardnotes/auth'
import { SettingName } from '@standardnotes/settings'

export interface SettingToSubscriptionMapInterface {
  getDefaultSettingsAndValuesForSubscriptionName(subscriptionName: SubscriptionName): Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }> | undefined
}
