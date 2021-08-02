import { RoleName } from '@standardnotes/auth'
import { AccountDeletionRequestedEvent, UserRegisteredEvent, UserRoleChangedEvent } from '@standardnotes/domain-events'
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

  createUserRoleChangedEvent(userUuid: string, email: string, role: RoleName): UserRoleChangedEvent {
    return {
      type: 'USER_ROLE_CHANGED',
      createdAt: dayjs.utc().toDate(),
      payload: {
        userUuid,
        email,
        role,
        timestamp: this.timer.getTimestampInMicroseconds(),
      },
    }
  }
}
