import { RoleName, SubscriptionName } from '@standardnotes/common'
import { PermissionName } from '@standardnotes/features'
import { LogSessionUserAgentOption, MuteSignInEmailsOption, SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { Permission } from '../Permission/Permission'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { SettingDescription } from './SettingDescription'

import { SettingsAssociationServiceInterface } from './SettingsAssociationServiceInterface'

@injectable()
export class SettingsAssociationService implements SettingsAssociationServiceInterface {
  constructor(
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
    @inject(TYPES.RoleRepository) private roleRepository: RoleRepositoryInterface,
  ) {
  }

  private readonly UNENCRYPTED_SETTINGS = [
    SettingName.EmailBackupFrequency,
    SettingName.MuteFailedBackupsEmails,
    SettingName.MuteFailedCloudBackupsEmails,
    SettingName.MuteSignInEmails,
    SettingName.DropboxBackupFrequency,
    SettingName.GoogleDriveBackupFrequency,
    SettingName.OneDriveBackupFrequency,
    SettingName.FileUploadBytesLimit,
    SettingName.FileUploadBytesUsed,
    SettingName.LogSessionUserAgent,
  ]

  private readonly UNSENSITIVE_SETTINGS = [
    SettingName.DropboxBackupFrequency,
    SettingName.GoogleDriveBackupFrequency,
    SettingName.OneDriveBackupFrequency,
    SettingName.EmailBackupFrequency,
    SettingName.MuteFailedBackupsEmails,
    SettingName.MuteFailedCloudBackupsEmails,
    SettingName.MuteSignInEmails,
    SettingName.ListedAuthorSecrets,
    SettingName.LogSessionUserAgent,
  ]

  private readonly CLIENT_IMMUTABLE_SETTINGS = [
    SettingName.FileUploadBytesLimit,
    SettingName.FileUploadBytesUsed,
    SettingName.ListedAuthorSecrets,
  ]

  private readonly permissionsAssociatedWithSettings = new Map<SettingName, PermissionName>([
    [SettingName.EmailBackupFrequency, PermissionName.DailyEmailBackup],
  ])

  private readonly settingsToSubscriptionNameMap = new Map<SubscriptionName, Map<SettingName, SettingDescription>>([
    [SubscriptionName.CorePlan, new Map([
      [SettingName.FileUploadBytesUsed, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: '0' }],
    ])],
    [SubscriptionName.PlusPlan, new Map([
      [SettingName.FileUploadBytesUsed, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: '0' }],
    ])],
    [SubscriptionName.ProPlan, new Map([
      [SettingName.FileUploadBytesUsed, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: '0' }],
    ])],
  ])

  private readonly defaultSettings = new Map<SettingName, SettingDescription>([
    [SettingName.MuteSignInEmails, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: MuteSignInEmailsOption.NotMuted }],
    [SettingName.LogSessionUserAgent, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: LogSessionUserAgentOption.Enabled }],
  ])

  private readonly vaultAccountDefaultSettingsOverwrites = new Map<SettingName, SettingDescription>([
    [SettingName.LogSessionUserAgent, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: LogSessionUserAgentOption.Disabled }],
  ])

  isSettingMutableByClient(settingName: SettingName): boolean {
    if (this.CLIENT_IMMUTABLE_SETTINGS.includes(settingName)) {
      return false
    }

    return true
  }

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

  async getDefaultSettingsAndValuesForSubscriptionName(subscriptionName: SubscriptionName): Promise<Map<SettingName, SettingDescription> | undefined> {
    const defaultSettings = this.settingsToSubscriptionNameMap.get(subscriptionName)

    if (defaultSettings === undefined) {
      return undefined
    }

    defaultSettings.set(SettingName.FileUploadBytesLimit, {
      sensitive: false,
      serverEncryptionVersion: EncryptionVersion.Unencrypted,
      value: (await this.getFileUploadLimit(subscriptionName)).toString(),
    })

    return defaultSettings
  }

  getDefaultSettingsAndValuesForNewUser(): Map<SettingName, SettingDescription> {
    return this.defaultSettings
  }

  getDefaultSettingsAndValuesForNewVaultAccount(): Map<SettingName, SettingDescription> {
    const defaultVaultSettings = new Map(this.defaultSettings)

    for (const vaultAccountDefaultSettingOverwriteKey of this.vaultAccountDefaultSettingsOverwrites.keys()) {
      defaultVaultSettings.set(
        vaultAccountDefaultSettingOverwriteKey,
        this.vaultAccountDefaultSettingsOverwrites.get(vaultAccountDefaultSettingOverwriteKey) as SettingDescription
      )
    }

    return defaultVaultSettings
  }

  async getFileUploadLimit(subscriptionName: SubscriptionName): Promise<number> {
    const roleName = this.roleToSubscriptionMap.getRoleNameForSubscriptionName(subscriptionName)

    const role = await this.roleRepository.findOneByName(roleName as RoleName)
    if (role == undefined) {
      throw new Error(`Could not find role with name: ${roleName}`)
    }

    const permissions = await role.permissions

    const uploadLimit5GB = permissions.find((permission: Permission) => permission.name === PermissionName.Files5GB)
    if (uploadLimit5GB !== undefined) {
      return 5_368_709_120
    }

    const uploadLimit25GB = permissions.find((permission: Permission) => permission.name === PermissionName.Files25GB)
    if (uploadLimit25GB !== undefined) {
      return 26_843_545_600
    }

    return 0
  }
}
