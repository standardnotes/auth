import { AccountDeletionRequestedEvent, SubscriptionPurchasedEvent, SubscriptionRefundedEvent, SubscriptionRenewedEvent, UserRegisteredEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createSubscriptionPurchasedEvent(): SubscriptionPurchasedEvent
  createSubscriptionRenewedEvent(): SubscriptionRenewedEvent
  createSubscriptionRefundedEvent(): SubscriptionRefundedEvent
}
