import 'reflect-metadata'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { AuthResponseFactoryInterface } from '../Auth/AuthResponseFactoryInterface'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'

import { UpdateUser } from './UpdateUser'
import { DomainEventPublisherInterface, UserChangedEmailEvent } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'

describe('UpdateUser', () => {
  let userRepository: UserRepositoryInterface
  let authResponseFactoryResolver: AuthResponseFactoryResolverInterface
  let authResponseFactory: AuthResponseFactoryInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let user: User

  const createUseCase = () => new UpdateUser(
    userRepository,
    authResponseFactoryResolver,
    domainEventPublisher,
    domainEventFactory
  )

  beforeEach(() => {
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    authResponseFactory = {} as jest.Mocked<AuthResponseFactoryInterface>
    authResponseFactory.createResponse = jest.fn().mockReturnValue({ foo: 'bar' })

    authResponseFactoryResolver = {} as jest.Mocked<AuthResponseFactoryResolverInterface>
    authResponseFactoryResolver.resolveAuthResponseFactoryVersion = jest.fn().mockReturnValue(authResponseFactory)

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createUserChangedEmailEvent = jest.fn().mockReturnValue({} as jest.Mocked<UserChangedEmailEvent>)

    user = {} as jest.Mocked<User>
    user.uuid = '123'
    user.email = 'test@test.te'
    user.createdAt = new Date(1)
  })

  it('should update user fields and save it', async () => {
    expect(await createUseCase().execute({
      user,
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      version: '004',
      pwCost: 11,
      pwSalt: 'qweqwe',
      pwNonce: undefined,
    })).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      createdAt: new Date(1),
      pwCost: 11,
      email: 'test@test.te',
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: '123',
      version: '004',
    })
    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createUserChangedEmailEvent).not.toHaveBeenCalled()
  })

  it('should fail to change user email if a user already exists with that email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue({} as jest.Mocked<User>)

    expect(await createUseCase().execute({
      user,
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      version: '004',
      email: 'test2@test.te',
    })).toEqual({ success: false })
  })

  it('should change user email', async () => {
    expect(await createUseCase().execute({
      user,
      updatedWithUserAgent: 'Mozilla',
      apiVersion: '20190520',
      version: '004',
      email: 'test2@test.te',
    })).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1)
    expect(domainEventFactory.createUserChangedEmailEvent).toHaveBeenLastCalledWith('123', 'test@test.te', 'test2@test.te')
  })
})
