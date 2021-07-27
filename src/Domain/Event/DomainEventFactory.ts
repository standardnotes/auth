import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRoleChangedEvent } from '@standardnotes/domain-events'
import * as dayjs from 'dayjs'
import { injectable } from 'inversify'
import { DomainEventFactoryInterface } from './DomainEventFactoryInterface'

@injectable()
export class DomainEventFactory implements DomainEventFactoryInterface {
  createAccountDeletionRequestedEvent(userUuid: string): AccountDeletionRequestedEvent {
    return {
      type: 'ACCOUNT_DELETION_REQUESTED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        userUuid,
      },
    }
  }

  createUserRegisteredEvent(userUuid: string, email: string): UserRegisteredEvent {
    return {
      type: 'USER_REGISTERED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        userUuid,
        email,
      },
    }
  }

  createUserRoleChangedEvent(userUuid: string, email: string, fromRole: RoleName, toRole: RoleName): UserRoleChangedEvent {
    return {
      type: 'USER_ROLE_CHANGED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        userUuid,
        email,
        fromRole,
        toRole,
        timestamp: dayjs.utc().valueOf(),
      },
    }
  }
}
