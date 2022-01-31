import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserEmailChangedEvent, UserRegisteredEvent, UserRolesChangedEvent, OfflineSubscriptionTokenCreatedEvent, EmailBackupRequestedEvent, CloudBackupRequestedEvent, ListedAccountRequestedEvent } from '@standardnotes/domain-events'
import { TimerInterface } from '@standardnotes/time'
import * as dayjs from 'dayjs'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { DomainEventFactoryInterface } from './DomainEventFactoryInterface'

@injectable()
export class DomainEventFactory implements DomainEventFactoryInterface {
  constructor (
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  createListedAccountRequestedEvent(userUuid: string, userEmail: string): ListedAccountRequestedEvent {
    return {
      type: 'LISTED_ACCOUNT_REQUESTED',
      createdAt: dayjs.utc().toDate(),
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

  createCloudBackupRequestedEvent(cloudProvider: 'DROPBOX' | 'ONE_DRIVE' | 'GOOGLE_DRIVE', cloudProviderToken: string, userUuid: string, muteEmailsSettingUuid: string, userHasEmailsMuted: boolean): CloudBackupRequestedEvent {
    return {
      type: 'CLOUD_BACKUP_REQUESTED',
      createdAt: dayjs.utc().toDate(),
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

  createEmailBackupRequestedEvent(userUuid: string, muteEmailsSettingUuid: string, userHasEmailsMuted: boolean): EmailBackupRequestedEvent {
    return {
      type: 'EMAIL_BACKUP_REQUESTED',
      createdAt: dayjs.utc().toDate(),
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

  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent {
    return {
      type: 'ACCOUNT_DELETION_REQUESTED',
      createdAt: dayjs.utc().toDate(),
      meta: {
        correlation: {
          userIdentifier: userUuid,
          userIdentifierType: 'uuid',
        },
      },
      payload: {
        userUuid,
      },
    }
  }

  createOfflineSubscriptionTokenCreatedEvent(token: string, email: string): OfflineSubscriptionTokenCreatedEvent {
    return {
      type: 'OFFLINE_SUBSCRIPTION_TOKEN_CREATED',
      createdAt: dayjs.utc().toDate(),
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
      createdAt: dayjs.utc().toDate(),
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
      createdAt: dayjs.utc().toDate(),
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
      createdAt: dayjs.utc().toDate(),
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
