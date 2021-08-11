import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
}
