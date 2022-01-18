import { SubscriptionName } from '@standardnotes/auth'
import { PermissionName } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'
import { injectable } from 'inversify'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

import { SettingsAssociationServiceInterface } from './SettingsAssociationServiceInterface'

@injectable()
export class SettingsAssociationService implements SettingsAssociationServiceInterface {
  private readonly UNENCRYPTED_SETTINGS = [
    SettingName.EmailBackupFrequency,
    SettingName.MuteFailedBackupsEmails,
    SettingName.MuteFailedCloudBackupsEmails,
    SettingName.DropboxBackupFrequency,
    SettingName.GoogleDriveBackupFrequency,
    SettingName.OneDriveBackupFrequency,
    SettingName.FileUploadBytesLimit,
    SettingName.FileUploadBytesUsed,
  ]

  private readonly UNSENSITIVE_SETTINGS = [
    SettingName.DropboxBackupFrequency,
    SettingName.GoogleDriveBackupFrequency,
    SettingName.OneDriveBackupFrequency,
    SettingName.EmailBackupFrequency,
    SettingName.MuteFailedBackupsEmails,
    SettingName.MuteFailedCloudBackupsEmails,
  ]

  private readonly permissionsAssociatedWithSettings = new Map<SettingName, PermissionName>([
    [SettingName.EmailBackupFrequency, PermissionName.DailyEmailBackup],
  ])

  private readonly settingsToSubscriptionNameMap = new Map<SubscriptionName, Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>>([
    [SubscriptionName.CorePlan, new Map([])],
    [SubscriptionName.PlusPlan, new Map([])],
    [SubscriptionName.ProPlan, new Map([])],
  ])

  getSensitivityForSetting(settingName: SettingName): boolean {
    if (this.UNSENSITIVE_SETTINGS.includes(settingName)) {
      return false
    }

    return true
  }

  getEncryptionVersionForSetting(settingName: SettingName): EncryptionVersion {
    if (this.UNENCRYPTED_SETTINGS.includes(settingName)) {
      return EncryptionVersion.Unencrypted
    }

    return EncryptionVersion.Default
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
