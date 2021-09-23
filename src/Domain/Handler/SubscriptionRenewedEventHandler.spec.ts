import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { SubscriptionRenewedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import * as dayjs from 'dayjs'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { SubscriptionRenewedEventHandler } from './SubscriptionRenewedEventHandler'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'

describe('SubscriptionRenewedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let logger: Logger
  let user: User
  let event: SubscriptionRenewedEvent
  let subscriptionExpirationDate: number
  let timestamp: number

  const createHandler = () => new SubscriptionRenewedEventHandler(
    userRepository,
    userSubscriptionRepository,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.updateEndsAtByNameAndUserUuid = jest.fn()

    timestamp = dayjs.utc().valueOf()
    subscriptionExpirationDate = dayjs.utc().valueOf() + 365*1000

    event = {} as jest.Mocked<SubscriptionRenewedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.ProPlan,
      subscriptionExpiresAt: subscriptionExpirationDate,
      timestamp,
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update subscription ends at', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.updateEndsAtByNameAndUserUuid
    ).toHaveBeenCalledWith(
      SubscriptionName.ProPlan,
      '123',
      subscriptionExpirationDate,
      timestamp,
    )
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(userSubscriptionRepository.updateEndsAtByNameAndUserUuid).not.toHaveBeenCalled()
  })
})
