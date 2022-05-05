import { RoleName, Uuid } from '@standardnotes/common'
import {
  AccountDeletionRequestedEvent,
  UserEmailChangedEvent,
  UserRegisteredEvent,
  UserRolesChangedEvent,
  OfflineSubscriptionTokenCreatedEvent,
  EmailBackupRequestedEvent,
  CloudBackupRequestedEvent,
  ListedAccountRequestedEvent,
  UserSignedInEvent,
  UserDisabledSessionUserAgentLoggingEvent,
  SharedSubscriptionInvitationCreatedEvent,
  SharedSubscriptionInvitationCanceledEvent,
} from '@standardnotes/domain-events'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { InviteeIdentifierType } from '../SharedSubscription/InviteeIdentifierType'
import { DomainEventFactoryInterface } from './DomainEventFactoryInterface'

@injectable()
export class DomainEventFactory implements DomainEventFactoryInterface {
  constructor(@inject(TYPES.Timer) private timer: TimerInterface) {}

  createSharedSubscriptionInvitationCanceledEvent(dto: {
    inviterEmail: string
    inviterSubscriptionId: number
    inviterSubscriptionUuid: Uuid
    inviteeIdentifier: string
    inviteeIdentifierType: InviteeIdentifierType
    sharedSubscriptionInvitationUuid: Uuid
  }): SharedSubscriptionInvitationCanceledEvent {
    return {
      type: 'SHARED_SUBSCRIPTION_INVITATION_CANCELED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: dto.inviterEmail,
          userIdentifierType: 'email',
        },
      },
      payload: dto,
    }
  }

  createSharedSubscriptionInvitationCreatedEvent(dto: {
    inviterEmail: string
    inviterSubscriptionId: number
    inviteeIdentifier: string
    inviteeIdentifierType: InviteeIdentifierType
    sharedSubscriptionInvitationUuid: string
  }): SharedSubscriptionInvitationCreatedEvent {
    return {
      type: 'SHARED_SUBSCRIPTION_INVITATION_CREATED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: dto.inviterEmail,
          userIdentifierType: 'email',
        },
      },
      payload: dto,
    }
  }

  createUserDisabledSessionUserAgentLoggingEvent(dto: {
    userUuid: string
    email: string
  }): UserDisabledSessionUserAgentLoggingEvent {
    return {
      type: 'USER_DISABLED_SESSION_USER_AGENT_LOGGING',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: dto.userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: dto,
    }
  }

  createUserSignedInEvent(dto: {
    userUuid: string
    userEmail: string
    device: string
    browser: string
    signInAlertEnabled: boolean
    muteSignInEmailsSettingUuid: Uuid
  }): UserSignedInEvent {
    return {
      type: 'USER_SIGNED_IN',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: dto.userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: dto,
    }
  }

  createListedAccountRequestedEvent(userUuid: string, userEmail: string): ListedAccountRequestedEvent {
    return {
      type: 'LISTED_ACCOUNT_REQUESTED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        userUuid,
        userEmail,
      },
    }
  }

  createCloudBackupRequestedEvent(
    cloudProvider: 'DROPBOX' | 'ONE_DRIVE' | 'GOOGLE_DRIVE',
    cloudProviderToken: string,
    userUuid: string,
    muteEmailsSettingUuid: string,
    userHasEmailsMuted: boolean,
  ): CloudBackupRequestedEvent {
    return {
      type: 'CLOUD_BACKUP_REQUESTED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        cloudProvider,
        cloudProviderToken,
        userUuid,
        userHasEmailsMuted,
        muteEmailsSettingUuid,
      },
    }
  }

  createEmailBackupRequestedEvent(
    userUuid: string,
    muteEmailsSettingUuid: string,
    userHasEmailsMuted: boolean,
  ): EmailBackupRequestedEvent {
    return {
      type: 'EMAIL_BACKUP_REQUESTED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        userUuid,
        userHasEmailsMuted,
        muteEmailsSettingUuid,
      },
    }
  }

  createAccountDeletionRequestedEvent(dto: {
    userUuid: Uuid
    regularSubscriptionUuid: Uuid | undefined
  }): AccountDeletionRequestedEvent {
    return {
      type: 'ACCOUNT_DELETION_REQUESTED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: dto.userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: dto,
    }
  }

  createOfflineSubscriptionTokenCreatedEvent(token: string, email: string): OfflineSubscriptionTokenCreatedEvent {
    return {
      type: 'OFFLINE_SUBSCRIPTION_TOKEN_CREATED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: email,
          userIdentifierType: 'email',
        },
      },
      payload: {
        token,
        email,
      },
    }
  }

  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent {
    return {
      type: 'USER_REGISTERED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        userUuid,
        email,
      },
    }
  }

  createUserEmailChangedEvent(userUuid: string, fromEmail: string, toEmail: string): UserEmailChangedEvent {
    return {
      type: 'USER_EMAIL_CHANGED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        userUuid,
        fromEmail,
        toEmail,
      },
    }
  }

  createUserRolesChangedEvent(userUuid: string, email: string, currentRoles: RoleName[]): UserRolesChangedEvent {
    return {
      type: 'USER_ROLES_CHANGED',
      createdAt: this.timer.getUTCDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        userUuid,
        email,
        currentRoles,
        timestamp: this.timer.getTimestampInMicroseconds(),
      },
    }
  }
}
