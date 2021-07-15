import 'reflect-metadata'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { CrypterInterface } from '../../Encryption/CrypterInterface'
import { Setting } from '../../Setting/Setting'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'

import { GetSetting } from './GetSetting'

describe('GetSetting', () => {
  let settingRepository: SettingRepositoryInterface
  let settingProjector: SettingProjector
  let userRepository: UserRepositoryInterface
  let user: User
  let crypter: CrypterInterface
  let setting: Setting

  const createUseCase = () => new GetSetting(settingRepository, settingProjector, userRepository, crypter)

  beforeEach(() => {
    setting = {} as jest.Mocked<Setting>

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    settingProjector = {} as jest.Mocked<SettingProjector>
    settingProjector.projectSimple = jest.fn().mockReturnValue({ foo: 'bar' })

    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    crypter = {} as jest.Mocked<CrypterInterface>
  })

  it('should find a setting for user', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: true,
      userUuid: '1-2-3',
      setting: { foo: 'bar' },
    })
  })

  it('should decrypt the value of a setting for user', async () => {
    setting = {
      value: 'encrypted',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: true,
      userUuid: '1-2-3',
      setting: { foo: 'bar' },
    })

    expect(settingProjector.projectSimple).toHaveBeenCalledWith({
      value: 'decrypted',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    })
  })

  it('should not decrypt the value of a setting for user if the user does not exist', async () => {
    setting = {
      value: 'encrypted',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: false,
      error: {
        message: 'User 1-2-3 not found.',
      },
    })
  })

  it('should decrypt and encoded value of a setting for user', async () => {
    setting = {
      value: 'encoded_and_encrypted',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
    } as jest.Mocked<Setting>

    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    crypter.decryptForUser = jest.fn().mockReturnValue('encoded_and_decrypted')

    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: true,
      userUuid: '1-2-3',
      setting: { foo: 'bar' },
    })

    expect(settingProjector.projectSimple).toHaveBeenCalledWith({
      value: 'encoded_and_decrypted',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
    })
  })

  it('should not find a setting for user if it does not exist', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: false,
      error: {
        message: 'Setting test for user 1-2-3 not found!',
      },
    })
  })

  it('should not find an mfa setting for user', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'MFA_SECRET' })).toEqual({
      success: false,
      error: {
        message: 'Setting MFA_SECRET for user 1-2-3 not found!',
      },
    })
  })

  it('should find an mfa setting for user if explicitly told to', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'MFA_SECRET', allowMFARetrieval: true })).toEqual({
      success: true,
      userUuid: '1-2-3',
      setting: { foo: 'bar' },
    })
  })
})
