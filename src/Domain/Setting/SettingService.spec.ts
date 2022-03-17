import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/common'
import { EmailBackupFrequency, LogSessionUserAgentOption, MuteSignInEmailsOption, SettingName } from '@standardnotes/settings'
import { Logger } from 'winston'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { User } from '../User/User'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

import { SettingService } from './SettingService'
import { SettingsAssociationServiceInterface } from './SettingsAssociationServiceInterface'
import { SettingInterpreterInterface } from './SettingInterpreterInterface'
import { SettingDecrypterInterface } from './SettingDecrypterInterface'

describe('SettingService', () => {
  let setting: Setting
  let user: User
  let factory: SettingFactory
  let settingRepository: SettingRepositoryInterface
  let settingsAssociationService: SettingsAssociationServiceInterface
  let settingInterpreter: SettingInterpreterInterface
  let settingDecrypter: SettingDecrypterInterface
  let logger: Logger

  const createService = () => new SettingService(
    factory,
    settingRepository,
    settingsAssociationService,
    settingInterpreter,
    settingDecrypter,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '4-5-6',
    } as jest.Mocked<User>
    user.isPotentiallyAVaultAccount = jest.fn().mockReturnValue(false)

    setting = {} as jest.Mocked<Setting>

    factory = {} as jest.Mocked<SettingFactory>
    factory.create = jest.fn().mockReturnValue(setting)
    factory.createReplacement = jest.fn().mockReturnValue(setting)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(undefined)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)
    settingRepository.save = jest.fn().mockImplementation(setting => setting)

    settingsAssociationService = {} as jest.Mocked<SettingsAssociationServiceInterface>
    settingsAssociationService.getDefaultSettingsAndValuesForSubscriptionName = jest.fn().mockReturnValue(new Map([
      [SettingName.EmailBackupFrequency,
        {
          value: EmailBackupFrequency.Weekly,
          sensitive: 0,
          serverEncryptionVersion: EncryptionVersion.Unencrypted,
        }],
    ]))
    settingsAssociationService.getDefaultSettingsAndValuesForNewUser = jest.fn().mockReturnValue(new Map([
      [SettingName.MuteSignInEmails, { value: MuteSignInEmailsOption.NotMuted, sensitive: 0, serverEncryptionVersion: EncryptionVersion.Unencrypted }],
    ]))

    settingsAssociationService.getDefaultSettingsAndValuesForNewVaultAccount = jest.fn().mockReturnValue(new Map([
      [SettingName.LogSessionUserAgent, { sensitive: false, serverEncryptionVersion: EncryptionVersion.Unencrypted, value: LogSessionUserAgentOption.Disabled }],
    ]))

    settingInterpreter = {} as jest.Mocked<SettingInterpreterInterface>
    settingInterpreter.interpretSettingUpdated = jest.fn()

    settingDecrypter = {} as jest.Mocked<SettingDecrypterInterface>
    settingDecrypter.decryptSettingValue = jest.fn().mockReturnValue('decrypted')

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
    logger.warn = jest.fn()
    logger.error = jest.fn()
  })

  it ('should create default settings for a newly registered user', async () => {
    await createService().applyDefaultSettingsUponRegistration(user)

    expect(settingRepository.save).toHaveBeenCalledWith(setting)
  })

  it ('should create default settings for a newly registered vault account', async () => {
    user.isPotentiallyAVaultAccount = jest.fn().mockReturnValue(true)

    await createService().applyDefaultSettingsUponRegistration(user)

    expect(settingRepository.save).toHaveBeenCalledWith(setting)
  })

  it ('should create default settings for a subscription', async () => {
    await createService().applyDefaultSettingsForSubscription(user, SubscriptionName.PlusPlan)

    expect(settingRepository.save).toHaveBeenCalledWith(setting)
  })

  it ('should not create default settings for a subscription if subscription has no defaults', async () => {
    settingsAssociationService.getDefaultSettingsAndValuesForSubscriptionName = jest.fn().mockReturnValue(undefined)

    await createService().applyDefaultSettingsForSubscription(user, SubscriptionName.PlusPlan)

    expect(settingRepository.save).not.toHaveBeenCalled()
  })

  it ('should create setting if it doesn\'t exist', async () => {
    const result = await createService().createOrReplace({
      user,
      props: {
        name: 'name',
        unencryptedValue: 'value',
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(result.status).toEqual('created')
  })

  it ('should create setting with a given uuid if it does not exist', async () => {
    settingRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        uuid: '1-2-3',
        name: 'name',
        unencryptedValue: 'value',
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(result.status).toEqual('created')
  })

  it ('should replace setting if it does exist', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    const result = await createService().createOrReplace({
      user: user,
      props: {
        ...setting,
        unencryptedValue: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('replaced')
  })

  it ('should replace setting with a given uuid if it does exist', async () => {
    settingRepository.findOneByUuid = jest.fn().mockReturnValue(setting)

    const result = await createService().createOrReplace({
      user: user,
      props: {
        ...setting,
        uuid: '1-2-3',
        unencryptedValue: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('replaced')
  })

  it('should find and decrypt the value of a setting for user', async () => {
    setting = {
      value: 'encrypted',
      serverEncryptionVersion: EncryptionVersion.Default,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    expect(await createService().findSettingWithDecryptedValue({ userUuid: '1-2-3', settingName: 'test' as SettingName })).toEqual({
      serverEncryptionVersion: 1,
      value: 'decrypted',
    })
  })
})
