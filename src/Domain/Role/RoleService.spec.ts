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
  let basicRole: Role
  let proRole: Role

  const createService = () => new RoleService(
    userRepository,
    roleRepository,
    webSocketsClientService,
    logger
  )

  beforeEach(() => {
    basicRole = {
      name: RoleName.BasicUser,
    } as jest.Mocked<Role>

    proRole = {
      name: RoleName.ProUser,
    } as jest.Mocked<Role>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(proRole)
    
    webSocketsClientService = {} as jest.Mocked<ClientServiceInterface>
    webSocketsClientService.sendUserRoleChangedEvent = jest.fn() 

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  describe('addUserRole', () => {
    beforeEach(() => {  
      user = {
        uuid: '123',
        email: 'test@test.com',
        roles: Promise.resolve([
          basicRole,
        ]),
      } as jest.Mocked<User>
  
      userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
      userRepository.save = jest.fn().mockReturnValue(user)
    })

    it('should add role to user', async () => {
      await createService().addUserRole(user, SubscriptionName.ProPlan)

      expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
      user.roles = Promise.resolve([
        basicRole,
        proRole,
      ])
      expect(userRepository.save).toHaveBeenCalledWith(user)
    })

    it('should send websockets event', async () => {
      await createService().addUserRole(user, SubscriptionName.ProPlan)

      expect(webSocketsClientService.sendUserRoleChangedEvent).toHaveBeenCalledWith(
        user,
        RoleName.ProUser
      )
    })

    it('should not add role if no role name exists for subscription name', async () => {
      await createService().addUserRole(user, 'test' as SubscriptionName)

      expect(userRepository.save).not.toHaveBeenCalled()
    })

    it('should not add role if no role exists for role name', async () => {
      roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)
      await createService().addUserRole(user, SubscriptionName.ProPlan)

      expect(userRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('removeUserRole', () => {
    beforeEach(() => {  
      user = {
        uuid: '123',
        email: 'test@test.com',
        roles: Promise.resolve([
          basicRole,
          proRole,
        ]),
      } as jest.Mocked<User>
  
      userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
      userRepository.save = jest.fn().mockReturnValue(user)
    })

    it('should remove role from user', async () => {
      await createService().removeUserRole(user, SubscriptionName.ProPlan)

      user.roles = Promise.resolve([
        basicRole,
      ])
      expect(userRepository.save).toHaveBeenCalledWith(user)
    })

    it('should send websockets event', async () => {
      await createService().removeUserRole(user, SubscriptionName.ProPlan)

      expect(webSocketsClientService.sendUserRoleChangedEvent).toHaveBeenCalledWith(
        user,
        RoleName.ProUser
      )
    })

    it('should not add role if no role name exists for subscription name', async () => {
      await createService().removeUserRole(user, 'test' as SubscriptionName)

      expect(userRepository.save).not.toHaveBeenCalled()
    })
  })
})
