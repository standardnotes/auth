import 'reflect-metadata'

import { SubscriptionPurchasedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'
import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { Role } from '../Role/Role'
import { SubscriptionPurchasedEventHandler } from './SubscriptionPurchasedEventHandler'
import { UserSubscription } from '../User/UserSubscription'

import * as dayjs from 'dayjs'

describe('SubscriptionPurchasedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let logger: Logger
  let user: User
  let role: Role
  let subscription: UserSubscription
  let event: SubscriptionPurchasedEvent
  let subscriptionExpiresAt: number
  let timestamp: number

  const createHandler = () => new SubscriptionPurchasedEventHandler(
    userRepository,
    roleRepository,
    userSubscriptionRepository,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>
    role = {} as jest.Mocked<Role>
    subscription = {} as jest.Mocked<UserSubscription>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
    userRepository.save = jest.fn().mockReturnValue(user)

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.save = jest.fn().mockReturnValue(subscription)

    timestamp = dayjs.utc().valueOf()
    subscriptionExpiresAt = timestamp + 365*1000

    event = {} as jest.Mocked<SubscriptionPurchasedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.ProPlan,
      subscriptionExpiresAt,
      timestamp,
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update the user role', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
    
    user.roles = Promise.resolve([role])
    expect(userRepository.save).toHaveBeenCalledWith(user)
  })

  it('should create subscription', async () => {
    await createHandler().handle(event)

    subscription.planName = SubscriptionName.ProPlan
    subscription.createdAt = timestamp
    subscription.updatedAt = timestamp
    subscription.endsAt = subscriptionExpiresAt
    subscription.user = Promise.resolve(user)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.save
    ).toHaveBeenCalledWith(subscription)
  })
})
