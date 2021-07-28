import { RoleName } from '@standardnotes/auth'
import 'reflect-metadata'

import { DomainEventFactory } from './DomainEventFactory'

describe('DomainEventFactory', () => {
  const createFactory = () => new DomainEventFactory()

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
    expect(createFactory().createUserRoleChangedEvent('1-2-3', 'test@test.com', RoleName.CoreUser, RoleName.ProUser))
      .toEqual({
        createdAt: expect.any(Date),
        payload: {
          userUuid: '1-2-3',
          email: 'test@test.com',
          fromRole: RoleName.CoreUser,
          toRole: RoleName.ProUser,
          timestamp: expect.any(Number),
        },
        type: 'USER_ROLE_CHANGED',
      })
  })
})
