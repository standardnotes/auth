import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { DomainEventPublisherInterface, EmailBackupRequestedEvent } from '@standardnotes/domain-events'
import { EmailBackupFrequency, SettingName } from '@standardnotes/settings'
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
import { SettingToSubscriptionMapInterface } from './SettingToSubscriptionMapInterface'

describe('SettingService', () => {
  let setting: Setting
  let user: User
  let factory: SettingFactory
  let settingRepository: SettingRepositoryInterface
  let userRepository: UserRepositoryInterface
  let crypter: CrypterInterface
  let settingToSubscriptionMap: SettingToSubscriptionMapInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let logger: Logger

  const createService = () => new SettingService(
    factory,
    settingRepository,
    userRepository,
    crypter,
    settingToSubscriptionMap,
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
    settingRepository.save = jest.fn().mockImplementation(setting => setting)

    settingToSubscriptionMap = {} as jest.Mocked<SettingToSubscriptionMapInterface>
    settingToSubscriptionMap.getDefaultSettingsAndValuesForSubscriptionName = jest.fn().mockReturnValue(new Map([
      [SettingName.EmailBackup,
        {
          value: EmailBackupFrequency.Weekly,
          sensitive: 0,
          serverEncryptionVersion: EncryptionVersion.Unencrypted,
        }],
    ]))

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createEmailBackupRequestedEvent = jest.fn().mockReturnValue({} as jest.Mocked<EmailBackupRequestedEvent>)

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
    logger.warn = jest.fn()
  })

  it ('should create default settings for a subscription', async () => {
    await createService().applyDefaultSettingsForSubscription(user, SubscriptionName.PlusPlan)

    expect(settingRepository.save).toHaveBeenCalledWith(setting)
  })

  it ('should not create default settings for a subscription if subscription has no defaults', async () => {
    settingToSubscriptionMap.getDefaultSettingsAndValuesForSubscriptionName = jest.fn().mockReturnValue(undefined)

    await createService().applyDefaultSettingsForSubscription(user, SubscriptionName.PlusPlan)

    expect(settingRepository.save).not.toHaveBeenCalled()
  })

  it ('should create setting if it doesn\'t exist', async () => {
    const result = await createService().createOrReplace({
      user,
      props: {
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(result.status).toEqual('created')
  })

  it ('should trigger backup if email backup setting is created - emails not muted', async () => {
    factory.create = jest.fn().mockReturnValue({
      name: SettingName.EmailBackup,
      value: EmailBackupFrequency.Daily,
    } as jest.Mocked<Setting>)
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        name: SettingName.EmailBackup,
        value: 'value',
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
      name: SettingName.EmailBackup,
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
        name: SettingName.EmailBackup,
        value: 'value',
        serverEncryptionVersion: 1,
        sensitive: false,
      },
    })

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createEmailBackupRequestedEvent).toHaveBeenCalledWith('4-5-6', '6-7-8', true)

    expect(result.status).toEqual('created')
  })

  it ('should create setting with a given uuid if it does not exist', async () => {
    settingRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        uuid: '1-2-3',
        name: 'name',
        value: 'value',
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
        value: 'value',
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
        value: 'value',
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
