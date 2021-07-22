import 'reflect-metadata'

import { SubscriptionRefundedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { SubscriptionRefundedEventHandler } from './SubscriptionRefundedEventHandler'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'
import { RoleName, SubscriptionName } from '@standardnotes/auth'
import * as dayjs from 'dayjs'
import { Role } from '../Role/Role'

describe('SubscriptionRefundedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let logger: Logger
  let user: User
  let role: Role
  let event: SubscriptionRefundedEvent
  let timestamp: number

  const createHandler = () => new SubscriptionRefundedEventHandler(
    userRepository,
    roleRepository,
    userSubscriptionRepository,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>
    role = {} as jest.Mocked<Role>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
    userRepository.save = jest.fn().mockReturnValue(user)

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.updateEndsAtByNameAndUserUuid = jest.fn()  

    timestamp = dayjs.utc().valueOf()

    event = {} as jest.Mocked<SubscriptionRefundedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.ProPlan,
      timestamp,
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update the user role', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.CoreUser)
    
    user.roles = Promise.resolve([role])
    expect(userRepository.save).toHaveBeenCalledWith(user)
  })

  it('should update subscription ends at', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.updateEndsAtByNameAndUserUuid
    ).toHaveBeenCalledWith(
      SubscriptionName.ProPlan,
      '123',
      timestamp,
      timestamp
    )
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(userRepository.save).not.toHaveBeenCalled()
    expect(userSubscriptionRepository.updateEndsAtByNameAndUserUuid).not.toHaveBeenCalled()
  })

  it ('should not update role if no role exists for role name', async () => {
    roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(userRepository.save).not.toHaveBeenCalled()
  })
})
