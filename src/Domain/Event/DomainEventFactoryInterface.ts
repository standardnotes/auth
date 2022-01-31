import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, CloudBackupRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent, UserEmailChangedEvent, OfflineSubscriptionTokenCreatedEvent, EmailBackupRequestedEvent, ListedAccountRequestedEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createListedAccountRequestedEvent(userUuid: string, userEmail: string): ListedAccountRequestedEvent
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createEmailBackupRequestedEvent(userUuid: string, muteEmailsSettingUuid: string, userHasEmailsMuted: boolean): EmailBackupRequestedEvent
  createCloudBackupRequestedEvent(cloudProvider: 'DROPBOX' | 'ONE_DRIVE' | 'GOOGLE_DRIVE', cloudProviderToken: string, userUuid: string, muteEmailsSettingUuid: string, userHasEmailsMuted: boolean): CloudBackupRequestedEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
  createUserEmailChangedEvent(userUuid: string, fromEmail: string, toEmail: string): UserEmailChangedEvent
  createOfflineSubscriptionTokenCreatedEvent(token: string, email: string): OfflineSubscriptionTokenCreatedEvent
}
