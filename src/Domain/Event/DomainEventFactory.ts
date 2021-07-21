import { SubscriptionName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, SubscriptionPurchasedEvent, SubscriptionRefundedEvent, SubscriptionRenewedEvent, UserRegisteredEvent } from '@standardnotes/domain-events'
import * as dayjs from 'dayjs'
import { injectable } from 'inversify'
import { DomainEventFactoryInterface } from './DomainEventFactoryInterface'

@injectable()
export class DomainEventFactory implements DomainEventFactoryInterface {
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent {
    return {
      type: 'ACCOUNT_DELETION_REQUESTED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        userUuid,
      },
    }
  }

  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent {
    return {
      type: 'USER_REGISTERED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        userUuid,
        email,
      },
    }
  }

  createSubscriptionPurchasedEvent(): SubscriptionPurchasedEvent {
    return {
      type: 'SUBSCRIPTION_PURCHASED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        subscriptionName: SubscriptionName.ProPlan,
        userEmail: 'antsgar@gmail.com',
        subscriptionExpiresAt: 1000,
        timestamp: 10,
      },
    }
  }

  createSubscriptionRenewedEvent(): SubscriptionRenewedEvent {
    return {
      type: 'SUBSCRIPTION_RENEWED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        subscriptionName: SubscriptionName.ProPlan,
        userEmail: 'antsgar@gmail.com',
        subscriptionExpiresAt: 2000,
        timestamp: 10,
      },
    }
  }

  createSubscriptionRefundedEvent(): SubscriptionRefundedEvent {
    return {
      type: 'SUBSCRIPTION_REFUNDED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        subscriptionName: SubscriptionName.ProPlan,
        userEmail: 'antsgar@gmail.com',
        timestamp: 10,
      },
    }
  }
}
