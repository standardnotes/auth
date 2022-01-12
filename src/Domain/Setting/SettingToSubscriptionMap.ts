import { SubscriptionName } from '@standardnotes/auth'
import { PermissionName } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'
import { injectable } from 'inversify'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

import { SettingToSubscriptionMapInterface } from './SettingToSubscriptionMapInterface'

@injectable()
export class SettingToSubscriptionMap implements SettingToSubscriptionMapInterface {
  private readonly encryptionVersionsAssociatedWithSettings = new Map<SettingName, EncryptionVersion>([
    [ SettingName.EmailBackupFrequency, EncryptionVersion.Unencrypted ],
    [ SettingName.MuteFailedBackupsEmails, EncryptionVersion.Unencrypted ],
    [ SettingName.MuteFailedCloudBackupsEmails, EncryptionVersion.Unencrypted ],
    [ SettingName.DropboxBackupFrequency, EncryptionVersion.Unencrypted ],
    [ SettingName.GoogleDriveBackupFrequency, EncryptionVersion.Unencrypted ],
    [ SettingName.OneDriveBackupFrequency, EncryptionVersion.Unencrypted ],
  ])

  private readonly sensitivityAssociatedWithSettings = new Map<SettingName, boolean>([
    [ SettingName.DropboxBackupFrequency, false ],
    [ SettingName.GoogleDriveBackupFrequency, false ],
    [ SettingName.OneDriveBackupFrequency, false ],
    [ SettingName.EmailBackupFrequency, false ],
    [ SettingName.MuteFailedBackupsEmails, false ],
    [ SettingName.MuteFailedCloudBackupsEmails, false ],
  ])

  private readonly permissionsAssociatedWithSettings = new Map<SettingName, PermissionName>([
    [SettingName.EmailBackupFrequency, PermissionName.DailyEmailBackup],
  ])

  private readonly settingsToSubscriptionNameMap = new Map<SubscriptionName, Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>>([
    [SubscriptionName.CorePlan, new Map([])],
    [SubscriptionName.PlusPlan, new Map([])],
    [SubscriptionName.ProPlan, new Map([])],
  ])

  getSensitivityForSetting(settingName: SettingName): boolean {
    if (!this.sensitivityAssociatedWithSettings.has(settingName)) {
      return true
    }

    return this.sensitivityAssociatedWithSettings.get(settingName) as boolean
  }

  getEncryptionVersionForSetting(settingName: SettingName): EncryptionVersion {
    if (!this.encryptionVersionsAssociatedWithSettings.has(settingName)) {
      return EncryptionVersion.Default
    }

    return this.encryptionVersionsAssociatedWithSettings.get(settingName) as EncryptionVersion
  }

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
