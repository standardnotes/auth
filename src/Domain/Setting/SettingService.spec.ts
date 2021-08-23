import { SettingName } from '@standardnotes/settings'
import 'reflect-metadata'
import { Logger } from 'winston'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

import { SettingService } from './SettingService'

describe('SettingService', () => {
  let setting: Setting
  let user: User
  let factory: SettingFactory
  let settingRepository: SettingRepositoryInterface
  let userRepository: UserRepositoryInterface
  let crypter: CrypterInterface
  let logger: Logger

  const createService = () => new SettingService(factory, settingRepository, userRepository, crypter, logger)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    setting = {} as jest.Mocked<Setting>

    factory = {} as jest.Mocked<SettingFactory>
    factory.create = jest.fn().mockReturnValue(setting)
    factory.createReplacement = jest.fn().mockReturnValue(setting)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(undefined)
    settingRepository.save = jest.fn()

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
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
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
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
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    expect(await createService().findSetting({ userUuid: '1-2-3', settingName: 'test' as SettingName })).toEqual(undefined)
  })

  it('should decrypt a encoded value of a setting for user', async () => {
    setting = {
      value: 'encoded_and_encrypted',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    crypter.decryptForUser = jest.fn().mockReturnValue('encoded_and_decrypted')

    expect(await createService().findSetting({ userUuid: '1-2-3', settingName: 'test' as SettingName })).toEqual({
      serverEncryptionVersion: 2,
      value: 'encoded_and_decrypted',
    })
  })
})
