import { RoleName } from '@standardnotes/auth'
import { TimerInterface } from '@standardnotes/time'
import 'reflect-metadata'

import { DomainEventFactory } from './DomainEventFactory'

describe('DomainEventFactory', () => {
  let timer: TimerInterface

  const createFactory = () => new DomainEventFactory(
    timer,
  )

  beforeEach(() => {
    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(1)
  })

  it('should create a USER_REGISTERED event', () => {
    expect(createFactory().createUserRegisteredEvent('1-2-3', 'test@test.te'))
      .toEqual({
        createdAt: expect.any(Date),
        payload: {
          userUuid: '1-2-3',
          email: 'test@test.te',
        },
        type: 'USER_REGISTERED',
      })
  })

  it('should create a DASHBOARD_TOKEN_CREATED event', () => {
    expect(createFactory().createDashboardTokenCreatedEvent('1-2-3', 'test@test.te'))
      .toEqual({
        createdAt: expect.any(Date),
        payload: {
          token: '1-2-3',
          email: 'test@test.te',
        },
        type: 'DASHBOARD_TOKEN_CREATED',
      })
  })

  it('should create a USER_CHANGED_EMAIL event', () => {
    expect(createFactory().createUserEmailChangedEvent('1-2-3', 'test@test.te', 'test2@test.te'))
      .toEqual({
        createdAt: expect.any(Date),
        payload: {
          userUuid: '1-2-3',
          fromEmail: 'test@test.te',
          toEmail: 'test2@test.te',
        },
        type: 'USER_EMAIL_CHANGED',
      })
  })

  it('should create a ACCOUNT_DELETION_REQUESTED event', () => {
    expect(createFactory().createAccountDeletionRequestedEvent('1-2-3'))
      .toEqual({
        createdAt: expect.any(Date),
        payload: {
          userUuid: '1-2-3',
        },
        type: 'ACCOUNT_DELETION_REQUESTED',
      })
  })

  it('should create a USER_ROLE_CHANGED event', () => {
    expect(createFactory().createUserRolesChangedEvent('1-2-3', 'test@test.com', [RoleName.ProUser]))
      .toEqual({
        createdAt: expect.any(Date),
        payload: {
          userUuid: '1-2-3',
          email: 'test@test.com',
          currentRoles: [RoleName.ProUser],
          timestamp: expect.any(Number),
        },
        type: 'USER_ROLES_CHANGED',
      })
  })
})
