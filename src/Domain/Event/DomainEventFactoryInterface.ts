import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent, UserEmailChangedEvent, OfflineSubscriptionTokenCreatedEvent, EmailBackupRequestedEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createEmailBackupRequestedEvent(userUuid: string, userHasEmailsMuted: boolean): EmailBackupRequestedEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
  createUserEmailChangedEvent(userUuid: string, fromEmail: string, toEmail: string): UserEmailChangedEvent
  createOfflineSubscriptionTokenCreatedEvent(token: string, email: string): OfflineSubscriptionTokenCreatedEvent
}
