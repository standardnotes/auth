import 'reflect-metadata'

import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { SubscriptionPurchasedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import * as dayjs from 'dayjs'

import { RoleServiceInterface } from '../Role/RoleServiceInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'
import { SubscriptionPurchasedEventHandler } from './SubscriptionPurchasedEventHandler'
import { UserSubscription } from '../User/UserSubscription'

describe('SubscriptionPurchasedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let roleService: RoleServiceInterface
  let logger: Logger
  let user: User
  let subscription: UserSubscription
  let event: SubscriptionPurchasedEvent
  let subscriptionExpiresAt: number
  let timestamp: number

  const createHandler = () => new SubscriptionPurchasedEventHandler(
    userRepository,
    userSubscriptionRepository,
    roleService,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
      email: 'test@test.com',
      roles: Promise.resolve([{
        name: RoleName.CoreUser,
      }]),
    } as jest.Mocked<User>
    subscription = {} as jest.Mocked<UserSubscription>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
    userRepository.save = jest.fn().mockReturnValue(user)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.save = jest.fn().mockReturnValue(subscription)

    roleService = {} as jest.Mocked<RoleServiceInterface>
    roleService.addUserRole = jest.fn()

    subscriptionExpiresAt = timestamp + 365*1000

    event = {} as jest.Mocked<SubscriptionPurchasedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.ProPlan,
      subscriptionExpiresAt,
      timestamp: dayjs.utc().valueOf(),
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update the user role', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(roleService.addUserRole).toHaveBeenCalledWith(user, SubscriptionName.ProPlan)
  })

  it('should create subscription', async () => {
    await createHandler().handle(event)

    subscription.planName = SubscriptionName.ProPlan
    subscription.endsAt = subscriptionExpiresAt
    subscription.user = Promise.resolve(user)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.save
    ).toHaveBeenCalledWith({
      ...subscription,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    })
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(roleService.addUserRole).not.toHaveBeenCalled()
    expect(userSubscriptionRepository.save).not.toHaveBeenCalled()
  })
})
