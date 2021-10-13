import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { SubscriptionCancelledEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import * as dayjs from 'dayjs'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { SubscriptionCancelledEventHandler } from './SubscriptionCancelledEventHandler'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'

describe('SubscriptionCancelledEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface
  let logger: Logger
  let user: User
  let event: SubscriptionCancelledEvent
  let timestamp: number

  const createHandler = () => new SubscriptionCancelledEventHandler(
    userRepository,
    userSubscriptionRepository,
    offlineUserSubscriptionRepository,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.updateCancelled = jest.fn()

    offlineUserSubscriptionRepository = {} as jest.Mocked<OfflineUserSubscriptionRepositoryInterface>
    offlineUserSubscriptionRepository.updateCancelled = jest.fn()

    timestamp = dayjs.utc().valueOf()

    event = {} as jest.Mocked<SubscriptionCancelledEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.ProPlan,
      timestamp,
      offline: false,
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update subscription cancelled', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.updateCancelled
    ).toHaveBeenCalledWith(
      SubscriptionName.ProPlan,
      '123',
      true,
      timestamp,
    )
  })

  it('should update offline subscription cancelled', async () => {
    event.payload.offline = true

    await createHandler().handle(event)

    expect(
      offlineUserSubscriptionRepository.updateCancelled
    ).toHaveBeenCalledWith(
      SubscriptionName.ProPlan,
      'test@test.com',
      true,
      timestamp,
    )
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(userSubscriptionRepository.updateCancelled).not.toHaveBeenCalled()
  })
})
