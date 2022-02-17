import 'reflect-metadata'

import { DomainEventPublisherInterface, UserSignedInEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import { AuthResponseFactoryInterface } from '../Auth/AuthResponseFactoryInterface'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { SessionServiceInterface } from '../Session/SessionServiceInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { SignIn } from './SignIn'
import { RoleName } from '@standardnotes/auth'
import { Role } from '../Role/Role'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'

describe('SignIn', () => {
  let user: User
  let userRepository: UserRepositoryInterface
  let authResponseFactoryResolver: AuthResponseFactoryResolverInterface
  let authResponseFactory: AuthResponseFactoryInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let sessionService: SessionServiceInterface
  let roleService: RoleServiceInterface
  let logger: Logger

  const createUseCase = () => new SignIn(
    userRepository,
    authResponseFactoryResolver,
    domainEventPublisher,
    domainEventFactory,
    sessionService,
    roleService,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '1-2-3',
      email: 'test@test.com',
    } as jest.Mocked<User>
    user.roles = Promise.resolve([
      {
        name: RoleName.BasicUser,
      } as Role,
      {
        name: RoleName.CoreUser,
      } as Role,
    ])
    user.encryptedPassword = '$2a$11$K3g6XoTau8VmLJcai1bB0eD9/YvBSBRtBhMprJOaVZ0U3SgasZH3a'

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    authResponseFactory = {} as jest.Mocked<AuthResponseFactoryInterface>
    authResponseFactory.createResponse = jest.fn().mockReturnValue({ foo: 'bar' })

    authResponseFactoryResolver = {} as jest.Mocked<AuthResponseFactoryResolverInterface>
    authResponseFactoryResolver.resolveAuthResponseFactoryVersion = jest.fn().mockReturnValue(authResponseFactory)

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createUserSignedInEvent = jest.fn().mockReturnValue({} as jest.Mocked<UserSignedInEvent>)

    sessionService = {} as jest.Mocked<SessionServiceInterface>
    sessionService.getOperatingSystemInfoFromUserAgent = jest.fn().mockReturnValue('iOS 1')
    sessionService.getBrowserInfoFromUserAgent = jest.fn().mockReturnValue('Firefox 1')

    roleService = {} as jest.Mocked<RoleServiceInterface>
    roleService.userHasPermission = jest.fn().mockReturnValue(true)

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
    logger.error = jest.fn()
  })

  it('should sign in a user', async () => {
    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'qweqwe123123',
      userAgent: 'Google Chrome',
      apiVersion: '20190520',
      ephemeralSession: false,
    })).toEqual({
      success: true,
      authResponse: { foo: 'bar' },
    })

    expect(domainEventFactory.createUserSignedInEvent).toHaveBeenCalledWith({
      browser: 'Firefox 1',
      device: 'iOS 1',
      userEmail: 'test@test.com',
      userRoles: [
        'BASIC_USER',
        'CORE_USER',
      ],
      userUuid: '1-2-3',
      signInAlertEnabled: true,
    })
    expect(domainEventPublisher.publish).toHaveBeenCalled()
  })

  it('should sign in a user even if publishing a sign in event fails', async () => {
    domainEventPublisher.publish = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'qweqwe123123',
      userAgent: 'Google Chrome',
      apiVersion: '20190520',
      ephemeralSession: false,
    })).toEqual({
      success: true,
      authResponse: { foo: 'bar' },
    })
  })

  it('should not sign in a user with wrong credentials', async () => {
    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'asdasd123123',
      userAgent: 'Google Chrome',
      apiVersion: '20190520',
      ephemeralSession: false,
    })).toEqual({
      success: false,
      errorMessage: 'Invalid email or password',
    })
  })

  it('should not sign in a user that does not exist', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({
      email: 'test@test.te',
      password: 'asdasd123123',
      userAgent: 'Google Chrome',
      apiVersion: '20190520',
      ephemeralSession: false,
    })).toEqual({
      success: false,
      errorMessage: 'Invalid email or password',
    })
  })
})
