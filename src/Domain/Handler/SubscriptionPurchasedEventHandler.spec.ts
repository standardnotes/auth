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
import { WebSocketsServiceInterface } from '../WebSockets/WebSocketsServiceInterface'

describe('SubscriptionPurchasedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let webSocketsService: WebSocketsServiceInterface
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
    webSocketsService,
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
    role = {} as jest.Mocked<Role>
    subscription = {} as jest.Mocked<UserSubscription>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
    userRepository.save = jest.fn().mockReturnValue(user)

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.save = jest.fn().mockReturnValue(subscription)
    
    webSocketsService = {} as jest.Mocked<WebSocketsServiceInterface>
    webSocketsService.sendUserRoleChangedEvent = jest.fn() 

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
    expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
    
    user.roles = Promise.resolve([role])
    expect(userRepository.save).toHaveBeenCalledWith(user)
  })

  it('should create subscription', async () => {
    await createHandler().handle(event)

    subscription.planName = SubscriptionName.ProPlan
    subscription.endsAt = subscriptionExpiresAt
    subscription.user = Promise.resolve(user)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.save
    ).toHaveBeenCalledWith(expect.objectContaining(subscription))
  })

  it('should send websockets event', async () => {
    await createHandler().handle(event)

    expect(webSocketsService.sendUserRoleChangedEvent).toHaveBeenCalledWith(
      user,
      RoleName.CoreUser,
      RoleName.ProUser
    )
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(userRepository.save).not.toHaveBeenCalled()
    expect(userSubscriptionRepository.save).not.toHaveBeenCalled()
  })

  it('should not update role if no role name exists for subscription name', async () => {
    event.payload.subscriptionName = '' as SubscriptionName

    await createHandler().handle(event)

    expect(userRepository.save).not.toHaveBeenCalled()
  })

  it ('should not update role if no role exists for role name', async () => {
    roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(userRepository.save).not.toHaveBeenCalled()
  })
})
