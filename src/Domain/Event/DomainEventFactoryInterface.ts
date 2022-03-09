import { Uuid, RoleName } from '@standardnotes/common'
import { AccountDeletionRequestedEvent, CloudBackupRequestedEvent, UserRegisteredEvent, UserRolesChangedEvent, UserEmailChangedEvent, OfflineSubscriptionTokenCreatedEvent, EmailBackupRequestedEvent, ListedAccountRequestedEvent, UserSignedInEvent } from '@standardnotes/domain-events'

export interface DomainEventFactoryInterface {
  createUserSignedInEvent(dto: {
    userUuid: string,
    userEmail: string,
    device: string,
    browser: string,
    signInAlertEnabled: boolean,
    muteSignInEmailsSettingUuid: Uuid,
  }): UserSignedInEvent
  createListedAccountRequestedEvent(userUuid: string, userEmail: string): ListedAccountRequestedEvent
  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent
  createEmailBackupRequestedEvent(userUuid: string, muteEmailsSettingUuid: string, userHasEmailsMuted: boolean): EmailBackupRequestedEvent
  createCloudBackupRequestedEvent(cloudProvider: 'DROPBOX' | 'ONE_DRIVE' | 'GOOGLE_DRIVE', cloudProviderToken: string, userUuid: string, muteEmailsSettingUuid: string, userHasEmailsMuted: boolean): CloudBackupRequestedEvent
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent
  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent
  createUserEmailChangedEvent(userUuid: string, fromEmail: string, toEmail: string): UserEmailChangedEvent
  createOfflineSubscriptionTokenCreatedEvent(token: string, email: string): OfflineSubscriptionTokenCreatedEvent
}
