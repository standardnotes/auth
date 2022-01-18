import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { SettingName } from '@standardnotes/settings'

import { SettingsAssociationService } from './SettingsAssociationService'
import { PermissionName } from '@standardnotes/features'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

describe('SettingsAssociationService', () => {
  const createService = () => new SettingsAssociationService()

  it('should tell if a setting is mutable by the client', () => {
    expect(createService().isSettingClientMutable(SettingName.DropboxBackupFrequency)).toBeTruthy()
  })

  it('should tell if a setting is immutable by the client', () => {
    expect(createService().isSettingClientMutable(SettingName.FileUploadBytesLimit)).toBeFalsy()
  })

  it('should return default encryption version for a setting which enecryption version is not strictly defined', () => {
    expect(createService().getEncryptionVersionForSetting(SettingName.MfaSecret)).toEqual(EncryptionVersion.Default)
  })

  it('should return a defined encryption version for a setting which enecryption version is strictly defined', () => {
    expect(createService().getEncryptionVersionForSetting(SettingName.EmailBackupFrequency)).toEqual(EncryptionVersion.Unencrypted)
  })

  it('should return default sensitivity for a setting which sensitivity is not strictly defined', () => {
    expect(createService().getSensitivityForSetting(SettingName.DropboxBackupToken)).toBeTruthy()
  })

  it('should return a defined sensitivity for a setting which sensitivity is strictly defined', () => {
    expect(createService().getSensitivityForSetting(SettingName.DropboxBackupFrequency)).toBeFalsy()
  })

  it('should return the default set of setting values for a core subscription', () => {
    const settings = createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.CorePlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return the default set of setting values for a plus subscription', () => {
    const settings = createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.PlusPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return the default set of setting values for a pro subscription', () => {
    const settings = createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.ProPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return undefined set of setting values for an undefined subscription', () => {
    const settings = createService().getDefaultSettingsAndValuesForSubscriptionName('foobar' as SubscriptionName)

    expect(settings).toBeUndefined()
  })

  it('should return a permission name associated to a given setting', () => {
    expect(createService().getPermissionAssociatedWithSetting(SettingName.EmailBackupFrequency)).toEqual(PermissionName.DailyEmailBackup)
  })

  it('should not return a permission name if not associated to a given setting', () => {
    expect(createService().getPermissionAssociatedWithSetting(SettingName.ExtensionKey)).toBeUndefined()
  })
})
