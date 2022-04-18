import 'reflect-metadata'

import { AccountDeletionRequestedEvent, DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { DeleteAccount } from './DeleteAccount'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { UserSubscription } from '../../Subscription/UserSubscription'
import { UserSubscriptionType } from '../../Subscription/UserSubscriptionType'

describe('DeleteAccount', () => {
  let userRepository: UserRepositoryInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let user: User
  let regularSubscription: UserSubscription
  let sharedSubscription: UserSubscription

  const createUseCase = () => new DeleteAccount(
    userRepository,
    userSubscriptionRepository,
    domainEventPublisher,
    domainEventFactory,
  )

  beforeEach(() => {
    user = {
      uuid: '1-2-3',
    } as jest.Mocked<User>

    regularSubscription = {
      uuid: '1-2-3',
      subscriptionType: UserSubscriptionType.Regular,
      user: Promise.resolve(user),
    } as jest.Mocked<UserSubscription>
    sharedSubscription = {
      uuid: '2-3-4',
      subscriptionType: UserSubscriptionType.Shared,
      user: Promise.resolve(user),
    } as jest.Mocked<UserSubscription>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(regularSubscription)

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createAccountDeletionRequestedEvent = jest.fn().mockReturnValue({} as jest.Mocked<AccountDeletionRequestedEvent>)
  })

  it('should trigger account deletion - no subscription', async () => {
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'Successfully deleted user',
      responseCode: 200,
      success: true,
    })

    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1)
    expect(domainEventFactory.createAccountDeletionRequestedEvent).toHaveBeenLastCalledWith({
      userUuid: '1-2-3',
      regularSubscriptionUuid: undefined,
    })
  })

  it('should trigger account deletion - regular subscription', async () => {
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(regularSubscription)

    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'Successfully deleted user',
      responseCode: 200,
      success: true,
    })

    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1)
    expect(domainEventFactory.createAccountDeletionRequestedEvent).toHaveBeenLastCalledWith({
      userUuid: '1-2-3',
      regularSubscriptionUuid: '1-2-3',
    })
  })

  it('should trigger account deletion - shared subscription', async () => {
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(sharedSubscription)
    userSubscriptionRepository.findBySubscriptionIdAndType = jest.fn().mockReturnValue([ regularSubscription ])

    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'Successfully deleted user',
      responseCode: 200,
      success: true,
    })

    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1)
    expect(domainEventFactory.createAccountDeletionRequestedEvent).toHaveBeenLastCalledWith({
      userUuid: '1-2-3',
      regularSubscriptionUuid: '1-2-3',
    })
  })

  it('should trigger account deletion - shared subscription, missing regular', async () => {
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(sharedSubscription)
    userSubscriptionRepository.findBySubscriptionIdAndType = jest.fn().mockReturnValue([])

    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'Successfully deleted user',
      responseCode: 200,
      success: true,
    })

    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1)
    expect(domainEventFactory.createAccountDeletionRequestedEvent).toHaveBeenLastCalledWith({
      userUuid: '1-2-3',
      regularSubscriptionUuid: undefined,
    })
  })

  it('should not trigger account deletion if user is not found', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'User not found',
      responseCode: 404,
      success: false,
    })

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createAccountDeletionRequestedEvent).not.toHaveBeenCalled()
  })
})
