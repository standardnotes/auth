import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent, UserEmailChangedEvent, OfflineSubscriptionTokenCreatedEvent, ItemsContentSizeRecalculationRequestedEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createItemsContentSizeRecalculationRequestedEvent(userUuid: string): ItemsContentSizeRecalculationRequestedEvent
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
  createUserEmailChangedEvent(userUuid: string, fromEmail: string, toEmail: string): UserEmailChangedEvent
  createOfflineSubscriptionTokenCreatedEvent(token: string, email: string): OfflineSubscriptionTokenCreatedEvent
}
