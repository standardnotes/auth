import { SubscriptionName } from '@standardnotes/auth'
import { PermissionName } from '@standardnotes/features'
import { EmailBackupFrequency, SettingName } from '@standardnotes/settings'
import { injectable } from 'inversify'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

import { SettingToSubscriptionMapInterface } from './SettingToSubscriptionMapInterface'

@injectable()
export class SettingToSubscriptionMap implements SettingToSubscriptionMapInterface {
  private readonly permissionsAssociatedWithSettings = new Map<SettingName, PermissionName>([
    [SettingName.EmailBackup, PermissionName.DailyEmailBackup],
  ])

  private readonly settingsToSubscriptionNameMap = new Map<SubscriptionName, Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>>([
    [SubscriptionName.CorePlan, new Map([])],
    [SubscriptionName.PlusPlan, new Map([
      [
        SettingName.EmailBackup,
        {
          value: EmailBackupFrequency.Weekly,
          sensitive: false,
          serverEncryptionVersion: EncryptionVersion.Unencrypted,
        },
      ],
    ])],
    [SubscriptionName.ProPlan, new Map([
      [
        SettingName.EmailBackup,
        {
          value: EmailBackupFrequency.Weekly,
          sensitive: false,
          serverEncryptionVersion: EncryptionVersion.Unencrypted,
        },
      ],
    ])],
  ])

  getPermissionAssociatedWithSetting(settingName: SettingName): PermissionName | undefined {
    if (!this.permissionsAssociatedWithSettings.has(settingName)) {
      return undefined
    }

    return this.permissionsAssociatedWithSettings.get(settingName)
  }

  getDefaultSettingsAndValuesForSubscriptionName(subscriptionName: SubscriptionName): Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }> | undefined {
    if (!this.settingsToSubscriptionNameMap.has(subscriptionName)) {
      return undefined
    }

    return this.settingsToSubscriptionNameMap.get(subscriptionName)
  }
}
