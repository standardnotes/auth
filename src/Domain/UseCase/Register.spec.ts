import 'reflect-metadata'
import { AuthResponseFactoryInterface } from '../Auth/AuthResponseFactoryInterface'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'
import { Role } from '../Role/Role'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { User } from '../User/User'
import { UserKeyRotatorInterface } from '../User/UserKeyRotatorInterface'

import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Register } from './Register'

describe('Register', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let authResponseFactoryResolver: AuthResponseFactoryResolverInterface
  let authResponseFactory: AuthResponseFactoryInterface
  let user: User
  let userKeyRotator: UserKeyRotatorInterface

  const createUseCase = () => new Register(userRepository, roleRepository, authResponseFactoryResolver, userKeyRotator, false)

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

    userKeyRotator = {} as jest.Mocked<UserKeyRotatorInterface>
    userKeyRotator.rotateServerKey = jest.fn()

    user = {} as jest.Mocked<User>
  })

  it('should register a new user', async () => {
    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'asdzxc',
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      ephemeralSession: false,
      version: '004',
      pwCost: 11,
      pwSalt: 'qweqwe',
      pwNonce: undefined
    })).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      SESSIONS_PROTOCOL_VERSION: 4
    })

    expect(userKeyRotator.rotateServerKey).toHaveBeenCalled()
  })

  it('should register a new user with default role', async () => {
    const role = new Role()
    role.name = 'role1'
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'asdzxc',
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      ephemeralSession: false,
      version: '004',
      pwCost: 11,
      pwSalt: 'qweqwe',
      pwNonce: undefined
    })).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      SESSIONS_PROTOCOL_VERSION: 4,
      roles: Promise.resolve([ role ])
    })

    expect(userKeyRotator.rotateServerKey).toHaveBeenCalled()
  })

  it('should fail to register if a user already exists', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'asdzxc',
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      ephemeralSession: false,
      version: '004',
      pwCost: 11,
      pwSalt: 'qweqwe',
      pwNonce: undefined
    })).toEqual({
      success: false,
      errorMessage: 'This email is already registered.'
    })

    expect(userRepository.save).not.toHaveBeenCalled()
    expect(userKeyRotator.rotateServerKey).not.toHaveBeenCalled()
  })

  it('should fail to register if a registration is disabled', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    expect(await new Register(userRepository, roleRepository, authResponseFactoryResolver, userKeyRotator, true).execute({
      email: 'test@test.te',
      password: 'asdzxc',
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      version: '004',
      ephemeralSession: false,
      pwCost: 11,
      pwSalt: 'qweqwe',
      pwNonce: undefined
    })).toEqual({
      success: false,
      errorMessage: 'User registration is currently not allowed.'
    })

    expect(userRepository.save).not.toHaveBeenCalled()
    expect(userKeyRotator.rotateServerKey).not.toHaveBeenCalled()
  })
})
