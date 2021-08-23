import { TimerInterface } from '@standardnotes/time'
import 'reflect-metadata'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from '../User/User'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingProps } from './SettingProps'

describe('SettingFactory', () => {
  let crypter: CrypterInterface
  let timer: TimerInterface
  let user: User

  const createFactory = () => new SettingFactory(crypter, timer)

  beforeEach(() => {
    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.encryptForUser = jest.fn().mockReturnValue('encrypted')

    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(1)

    user = {} as jest.Mocked<User>
  })

  it('should create a Setting', async () => {
    const props: SettingProps = {
      name: 'name',
      value: 'value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: false,
    }
    const actual = await createFactory().create(props, user)

    expect(actual).toEqual({
      createdAt: 1,
      updatedAt: 1,
      name: 'name',
      sensitive: false,
      serverEncryptionVersion: 0,
      user: Promise.resolve(user),
      uuid: expect.any(String),
      value: 'value',
    })
  })

  it('should create a Setting replacement', async () => {
    const original = {} as jest.Mocked<Setting>
    original.uuid = '2-3-4'

    const props: SettingProps = {
      name: 'name',
      value: 'value2',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: true,
    }

    const actual = await createFactory().createReplacement(original, props)

    expect(actual).toEqual({
      createdAt: 1,
      updatedAt: 1,
      name: 'name',
      sensitive: true,
      serverEncryptionVersion: 0,
      user: Promise.resolve(user),
      uuid: '2-3-4',
      value: 'value2',
    })
  })

  it('should create an encrypted Setting', async () => {
    const value = 'value'
    const props: SettingProps = {
      name: 'name',
      value,
      sensitive: false,
    }

    const actual = await createFactory()
      .create(props, user)

    expect(actual).toEqual({
      createdAt: 1,
      updatedAt: 1,
      name: 'name',
      sensitive: false,
      serverEncryptionVersion: 1,
      user: Promise.resolve(user),
      uuid: expect.any(String),
      value: 'encrypted',
    })
  })

  it('should throw for unrecognized encryption version', async () => {
    const value = 'value'
    const props: SettingProps = {
      name: 'name',
      value,
      serverEncryptionVersion: 99999999999,
      sensitive: false,
    }

    await expect(async () => await createFactory()
      .create(props, user)).rejects.toThrow()
  })
})
