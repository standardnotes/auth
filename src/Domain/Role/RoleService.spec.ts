import 'reflect-metadata'

import { Logger } from 'winston'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { Role } from '../Role/Role'

import { ClientServiceInterface } from '../Client/ClientServiceInterface'
import { RoleService } from './RoleService'

describe('RoleService', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let webSocketsClientService: ClientServiceInterface
  let logger: Logger
  let user: User
  let role: Role

  const createService = () => new RoleService(
    userRepository,
    roleRepository,
    webSocketsClientService,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
      email: 'test@test.com',
      roles: Promise.resolve([{
        name: RoleName.CoreUser,
      }]),
    } as jest.Mocked<User>
    role = {} as jest.Mocked<Role>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
    userRepository.save = jest.fn().mockReturnValue(user)

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)
    
    webSocketsClientService = {} as jest.Mocked<ClientServiceInterface>
    webSocketsClientService.sendUserRoleChangedEvent = jest.fn() 

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update the user role', async () => {
    await createService().updateUserRole(user, SubscriptionName.ProPlan)

    expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
    
    user.roles = Promise.resolve([
      ...(await user.roles),
      role,
    ])
    expect(userRepository.save).toHaveBeenCalledWith(user)
  })

  it('should send websockets event', async () => {
    await createService().updateUserRole(user, SubscriptionName.ProPlan)

    expect(webSocketsClientService.sendUserRoleChangedEvent).toHaveBeenCalledWith(
      user,
      RoleName.CoreUser,
      RoleName.ProUser
    )
  })

  it('should not update role if no role name exists for subscription name', async () => {
    await createService().updateUserRole(user, '' as SubscriptionName)

    expect(userRepository.save).not.toHaveBeenCalled()
  })

  it ('should not update role if no role exists for role name', async () => {
    roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)

    await createService().updateUserRole(user, SubscriptionName.ProPlan)

    expect(userRepository.save).not.toHaveBeenCalled()
  })
})
