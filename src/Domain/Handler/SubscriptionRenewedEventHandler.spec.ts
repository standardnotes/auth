import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { SubscriptionRenewedEvent } from '@standardnotes/domain-events'

import * as dayjs from 'dayjs'

import { SubscriptionRenewedEventHandler } from './SubscriptionRenewedEventHandler'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'

describe('SubscriptionRenewedEventHandler', () => {
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface
  let event: SubscriptionRenewedEvent
  let subscriptionExpirationDate: number
  let timestamp: number

  const createHandler = () => new SubscriptionRenewedEventHandler(
    userSubscriptionRepository,
    offlineUserSubscriptionRepository,
  )

  beforeEach(() => {
    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.updateEndsAt = jest.fn()

    offlineUserSubscriptionRepository = {} as jest.Mocked<OfflineUserSubscriptionRepositoryInterface>
    offlineUserSubscriptionRepository.updateEndsAt = jest.fn()

    timestamp = dayjs.utc().valueOf()
    subscriptionExpirationDate = dayjs.utc().valueOf() + 365*1000

    event = {} as jest.Mocked<SubscriptionRenewedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      subscriptionId: 1,
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.ProPlan,
      subscriptionExpiresAt: subscriptionExpirationDate,
      timestamp,
      offline: false,
    }
  })

  it('should update subscription ends at', async () => {
    await createHandler().handle(event)

    expect(
      userSubscriptionRepository.updateEndsAt
    ).toHaveBeenCalledWith(
      1,
      subscriptionExpirationDate,
      timestamp,
    )
  })

  it('should update offline subscription ends at', async () => {
    event.payload.offline = true

    await createHandler().handle(event)

    expect(
      offlineUserSubscriptionRepository.updateEndsAt
    ).toHaveBeenCalledWith(
      1,
      timestamp,
      timestamp,
    )
  })
})
