import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent, UserChangedEmailEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
  createUserChangedEmailEvent(userUuid: string, fromEmail: string, toEmail: string): UserChangedEmailEvent
}
