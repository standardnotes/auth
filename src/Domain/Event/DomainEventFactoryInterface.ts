import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent, UserEmailChangedEvent, DashboardTokenCreatedEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
  createUserEmailChangedEvent(userUuid: string, fromEmail: string, toEmail: string): UserEmailChangedEvent
  createDashboardTokenCreatedEvent(token: string, email: string): DashboardTokenCreatedEvent
}
