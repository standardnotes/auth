import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRoleChangedEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRoleChangedEvent(userUuid: string, email: string, fromRole: string, toRole: string): UserRoleChangedEvent
}
