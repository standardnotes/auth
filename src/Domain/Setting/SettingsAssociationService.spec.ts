import 'reflect-metadata'

import { RoleName, SubscriptionName } from '@standardnotes/common'
import { SettingName } from '@standardnotes/settings'

import { SettingsAssociationService } from './SettingsAssociationService'
import { PermissionName } from '@standardnotes/features'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { Role } from '../Role/Role'
import { Permission } from '../Permission/Permission'

describe('SettingsAssociationService', () => {
  let roleToSubscriptionMap: RoleToSubscriptionMapInterface
  let roleRepository: RoleRepositoryInterface
  let role: Role

  const createService = () => new SettingsAssociationService(roleToSubscriptionMap, roleRepository)

  beforeEach(() => {
    roleToSubscriptionMap = {} as jest.Mocked<RoleToSubscriptionMapInterface>
    roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(RoleName.CoreUser)

    role = {} as jest.Mocked<Role>

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)
  })


  it('should tell if a setting is mutable by the client', () => {
    expect(createService().isSettingMutableByClient(SettingName.DropboxBackupFrequency)).toBeTruthy()
  })

  it('should tell if a setting is immutable by the client', () => {
    expect(createService().isSettingMutableByClient(SettingName.FileUploadBytesLimit)).toBeFalsy()
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

  it('should return the default set of settings for a newly registered user', () => {
    const settings = createService().getDefaultSettingsAndValuesForNewUser()
    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([
      'MUTE_SIGN_IN_EMAILS',
    ])
  })

  it('should return the default set of setting values for a core subscription', async () => {
    const permission = {
      name: PermissionName.Files5GB,
    } as jest.Mocked<Permission>
    role.permissions = Promise.resolve([ permission ])
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    const settings = await createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.CorePlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([
      'FILE_UPLOAD_BYTES_USED',
      'FILE_UPLOAD_BYTES_LIMIT',
    ])
    expect(settings?.get(SettingName.FileUploadBytesLimit)).toEqual({ sensitive: false, serverEncryptionVersion: 0, value: '5368709120' })
  })

  it('should return the default set of setting values for a plus subscription', async () => {
    const permission = {
      name: PermissionName.Files25GB,
    } as jest.Mocked<Permission>
    role.permissions = Promise.resolve([ permission ])
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    const settings = await createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.PlusPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: EncryptionVersion }>).keys()]
    expect(flatSettings).toEqual([
      'FILE_UPLOAD_BYTES_USED',
      'FILE_UPLOAD_BYTES_LIMIT',
    ])
    expect(settings?.get(SettingName.FileUploadBytesLimit)).toEqual({ sensitive: false, serverEncryptionVersion: 0, value: '26843545600' })
  })

  it('should return the default set of setting values for a pro subscription', async () => {
    const permission = {
      name: PermissionName.Files,
    } as jest.Mocked<Permission>
    role.permissions = Promise.resolve([ permission ])
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    const settings = await createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.ProPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: EncryptionVersion }>).keys()]
    expect(flatSettings).toEqual([
      'FILE_UPLOAD_BYTES_USED',
      'FILE_UPLOAD_BYTES_LIMIT',
    ])
    expect(settings?.get(SettingName.FileUploadBytesLimit)).toEqual({ sensitive: false, serverEncryptionVersion: 0, value: '-1' })
  })

  it('should throw error if a role is not found when getting default setting values for a subscription', async () => {
    const permission = {
      name: PermissionName.Files,
    } as jest.Mocked<Permission>
    role.permissions = Promise.resolve([ permission ])
    roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)

    let caughtError = null
    try {
      await createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.ProPlan)
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).not.toBeNull()
  })

  it('should throw error if a file upload setting is not found when getting default setting values for a subscription', async () => {
    const permission = {
      name: PermissionName.FocusMode,
    } as jest.Mocked<Permission>
    role.permissions = Promise.resolve([ permission ])
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    let caughtError = null
    try {
      await createService().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.ProPlan)
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).not.toBeNull()
  })

  it('should return undefined set of setting values for an undefined subscription', async () => {
    const settings = await createService().getDefaultSettingsAndValuesForSubscriptionName('foobar' as SubscriptionName)

    expect(settings).toBeUndefined()
  })

  it('should return a permission name associated to a given setting', () => {
    expect(createService().getPermissionAssociatedWithSetting(SettingName.EmailBackupFrequency)).toEqual(PermissionName.DailyEmailBackup)
  })

  it('should not return a permission name if not associated to a given setting', () => {
    expect(createService().getPermissionAssociatedWithSetting(SettingName.ExtensionKey)).toBeUndefined()
  })
})
