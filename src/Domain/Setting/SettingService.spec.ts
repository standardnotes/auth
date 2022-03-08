import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { CloudBackupRequestedEvent, DomainEventPublisherInterface, EmailBackupRequestedEvent } from '@standardnotes/domain-events'
import { EmailBackupFrequency, MuteSignInEmailsOption, OneDriveBackupFrequency, SettingName } from '@standardnotes/settings'
import { Logger } from 'winston'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

import { SettingService } from './SettingService'
import { SettingsAssociationServiceInterface } from './SettingsAssociationServiceInterface'

describe('SettingService', () => {
  let setting: Setting
  let user: User
  let factory: SettingFactory
  let settingRepository: SettingRepositoryInterface
  let userRepository: UserRepositoryInterface
  let crypter: CrypterInterface
  let settingsAssociationService: SettingsAssociationServiceInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let logger: Logger

  const createService = () => new SettingService(
    factory,
    settingRepository,
    userRepository,
    crypter,
    settingsAssociationService,
    domainEventPublisher,
    domainEventFactory,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '4-5-6',
    } as jest.Mocked<User>

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

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createEmailBackupRequestedEvent = jest.fn().mockReturnValue({} as jest.Mocked<EmailBackupRequestedEvent>)
    domainEventFactory.createCloudBackupRequestedEvent = jest.fn().mockReturnValue({} as jest.Mocked<CloudBackupRequestedEvent>)

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
    logger.warn = jest.fn()
    logger.error = jest.fn()
  })

  it ('should create default settings for a newly registered user', async () => {
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

  it ('should trigger backup if email backup setting is created - emails not muted', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.EmailBackupFrequency,
      value: EmailBackupFrequency.Daily,
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.EmailBackupFrequency,
        unencryptedValue: 'value',
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createEmailBackupRequestedEvent).toHaveBeenCalledWith('4-5-6', '', false)

    expect(result.status).toEqual('created')
  })

  it ('should trigger backup if email backup setting is created - emails muted', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.EmailBackupFrequency,
      value: EmailBackupFrequency.Daily,
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SettingName.MuteFailedBackupsEmails,
      uuid: '6-7-8',
      value: 'muted',
    } as jest.Mocked<Setting>)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.EmailBackupFrequency,
        unencryptedValue: 'value',
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createEmailBackupRequestedEvent).toHaveBeenCalledWith('4-5-6', '6-7-8', true)

    expect(result.status).toEqual('created')
  })

  it ('should not trigger backup if email backup setting is disabled', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.EmailBackupFrequency,
      value: EmailBackupFrequency.Disabled,
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.EmailBackupFrequency,
        unencryptedValue: EmailBackupFrequency.Disabled,
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createEmailBackupRequestedEvent).not.toHaveBeenCalled()

    expect(result.status).toEqual('created')
  })

  it ('should trigger cloud backup if dropbox backup setting is created', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.DropboxBackupToken,
      value: 'test-token',
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.DropboxBackupToken,
        unencryptedValue: 'test-token',
        serverEncryptionVersion: 1,
        sensitive: true,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).toHaveBeenCalledWith(
      'DROPBOX',
      'test-token',
      '4-5-6',
      '',
      false
    )

    expect(result.status).toEqual('created')
  })

  it ('should trigger cloud backup if dropbox backup setting is created - muted emails', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.DropboxBackupToken,
      value: 'test-token',
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SettingName.MuteFailedCloudBackupsEmails,
      uuid: '6-7-8',
      value: 'muted',
    } as jest.Mocked<Setting>)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.DropboxBackupToken,
        unencryptedValue: 'test-token',
        serverEncryptionVersion: 1,
        sensitive: true,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).toHaveBeenCalledWith(
      'DROPBOX',
      'test-token',
      '4-5-6',
      '6-7-8',
      true
    )

    expect(result.status).toEqual('created')
  })

  it ('should trigger cloud backup if google drive backup setting is created', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.GoogleDriveBackupToken,
      value: 'test-token',
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.GoogleDriveBackupToken,
        unencryptedValue: 'test-token',
        serverEncryptionVersion: 1,
        sensitive: true,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).toHaveBeenCalledWith(
      'GOOGLE_DRIVE',
      'test-token',
      '4-5-6',
      '',
      false
    )

    expect(result.status).toEqual('created')
  })

  it ('should trigger cloud backup if one drive backup setting is created', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.OneDriveBackupToken,
      value: 'test-token',
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.OneDriveBackupToken,
        unencryptedValue: 'test-token',
        serverEncryptionVersion: 1,
        sensitive: true,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).toHaveBeenCalledWith(
      'ONE_DRIVE',
      'test-token',
      '4-5-6',
      '',
      false
    )

    expect(result.status).toEqual('created')
  })

  it ('should trigger cloud backup if backup frequency setting is updated and a backup token setting is present', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn()
      .mockReturnValueOnce({
        name: SettingName.OneDriveBackupFrequency,
        serverEncryptionVersion: 0,
        value: 'daily',
        sensitive: false,
      } as jest.Mocked<Setting>)
      .mockReturnValueOnce({
        name: SettingName.OneDriveBackupToken,
        serverEncryptionVersion: 1,
        value: 'encrypted-backup-token',
        sensitive: true,
      } as jest.Mocked<Setting>)
    factory.createReplacement = jest.fn().mockReturnValue({
      name: SettingName.OneDriveBackupFrequency,
      serverEncryptionVersion: 0,
      value: 'daily',
      sensitive: false,
    } as jest.Mocked<Setting>)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.OneDriveBackupFrequency,
        unencryptedValue: 'daily',
        serverEncryptionVersion: 0,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).toHaveBeenCalledWith(
      'ONE_DRIVE',
      'decrypted',
      '4-5-6',
      '',
      false
    )

    expect(result.status).toEqual('replaced')
  })

  it ('should not trigger cloud backup if backup frequency setting is updated as disabled', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn()
      .mockReturnValueOnce({
        name: SettingName.OneDriveBackupFrequency,
        serverEncryptionVersion: 0,
        value: 'daily',
        sensitive: false,
      } as jest.Mocked<Setting>)
      .mockReturnValueOnce({
        name: SettingName.OneDriveBackupToken,
        serverEncryptionVersion: 1,
        value: 'encrypted-backup-token',
        sensitive: true,
      } as jest.Mocked<Setting>)
    factory.createReplacement = jest.fn().mockReturnValue({
      name: SettingName.OneDriveBackupFrequency,
      serverEncryptionVersion: 0,
      value: OneDriveBackupFrequency.Disabled,
      sensitive: false,
    } as jest.Mocked<Setting>)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.OneDriveBackupFrequency,
        unencryptedValue: OneDriveBackupFrequency.Disabled,
        serverEncryptionVersion: 0,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).not.toHaveBeenCalled()

    expect(result.status).toEqual('replaced')
  })

  it ('should not trigger cloud backup if backup frequency setting is updated and a backup token setting is not present', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn()
      .mockReturnValueOnce({
        name: SettingName.OneDriveBackupFrequency,
        serverEncryptionVersion: 0,
        value: 'daily',
        sensitive: false,
      } as jest.Mocked<Setting>)
      .mockReturnValueOnce(undefined)
    factory.createReplacement = jest.fn().mockReturnValue({
      name: SettingName.OneDriveBackupFrequency,
      serverEncryptionVersion: 0,
      value: 'daily',
      sensitive: false,
    } as jest.Mocked<Setting>)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.OneDriveBackupFrequency,
        unencryptedValue: 'daily',
        serverEncryptionVersion: 0,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createCloudBackupRequestedEvent).not.toHaveBeenCalled()

    expect(result.status).toEqual('replaced')
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

    expect(await createService().findSetting({ userUuid: '1-2-3', settingName: 'test' as SettingName })).toEqual({
      serverEncryptionVersion: 1,
      value: 'decrypted',
    })
  })

  it('should not find a setting for user if the user does not exist', async () => {
    setting = {
      value: 'encrypted',
      serverEncryptionVersion: EncryptionVersion.Default,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    expect(await createService().findSetting({ userUuid: '1-2-3', settingName: 'test' as SettingName })).toEqual(undefined)
  })
})
