import 'reflect-metadata'
import { TimerInterface } from '@standardnotes/time'
import { AuthResponseFactoryInterface } from '../Auth/AuthResponseFactoryInterface'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { Role } from '../Role/Role'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { User } from '../User/User'

import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Register } from './Register'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

describe('Register', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let authResponseFactoryResolver: AuthResponseFactoryResolverInterface
  let authResponseFactory: AuthResponseFactoryInterface
  let settingService: SettingServiceInterface
  let user: User
  let crypter: CrypterInterface
  let timer: TimerInterface

  const createUseCase = () =>
    new Register(userRepository, roleRepository, authResponseFactoryResolver, crypter, false, settingService, timer)

  beforeEach(() => {
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()
    userRepository.findOneByEmail = jest.fn()

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn()

    authResponseFactory = {} as jest.Mocked<AuthResponseFactoryInterface>
    authResponseFactory.createResponse = jest.fn().mockReturnValue({ foo: 'bar' })

    authResponseFactoryResolver = {} as jest.Mocked<AuthResponseFactoryResolverInterface>
    authResponseFactoryResolver.resolveAuthResponseFactoryVersion = jest.fn().mockReturnValue(authResponseFactory)

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.generateEncryptedUserServerKey = jest.fn().mockReturnValue('test')

    user = {} as jest.Mocked<User>

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.applyDefaultSettingsUponRegistration = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.getUTCDate = jest.fn().mockReturnValue(new Date(1))
  })

  it('should register a new user', async () => {
    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20190520',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      encryptedServerKey: 'test',
      serverEncryptionVersion: 1,
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      createdAt: new Date(1),
      updatedAt: new Date(1),
      SESSIONS_PROTOCOL_VERSION: 4,
    })

    expect(settingService.applyDefaultSettingsUponRegistration).toHaveBeenCalled()
  })

  it('should register a new user with default role', async () => {
    const role = new Role()
    role.name = 'role1'
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20190520',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      encryptedServerKey: 'test',
      serverEncryptionVersion: 1,
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      createdAt: new Date(1),
      updatedAt: new Date(1),
      SESSIONS_PROTOCOL_VERSION: 4,
      roles: Promise.resolve([role]),
    })
  })

  it('should fail to register if a user already exists', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20190520',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({
      success: false,
      errorMessage: 'This email is already registered.',
    })

    expect(userRepository.save).not.toHaveBeenCalled()
  })

  it('should fail to register if a registration is disabled', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    expect(
      await new Register(
        userRepository,
        roleRepository,
        authResponseFactoryResolver,
        crypter,
        true,
        settingService,
        timer,
      ).execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20190520',
        version: '004',
        ephemeralSession: false,
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({
      success: false,
      errorMessage: 'User registration is currently not allowed.',
    })

    expect(userRepository.save).not.toHaveBeenCalled()
  })
})
