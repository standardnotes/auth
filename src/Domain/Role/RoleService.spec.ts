import 'reflect-metadata'

import { Logger } from 'winston'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { Role } from '../Role/Role'

import { ClientServiceInterface } from '../Client/ClientServiceInterface'
import { RoleService } from './RoleService'
import { RoleToSubscriptionMapInterface } from './RoleToSubscriptionMapInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'

describe('RoleService', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let offlineUserSubscription: OfflineUserSubscription
  let offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface
  let roleToSubscriptionMap: RoleToSubscriptionMapInterface
  let webSocketsClientService: ClientServiceInterface
  let logger: Logger
  let user: User
  let basicRole: Role
  let proRole: Role
  let coreRole: Role

  const createService = () => new RoleService(
    userRepository,
    roleRepository,
    offlineUserSubscriptionRepository,
    webSocketsClientService,
    roleToSubscriptionMap,
    logger
  )

  beforeEach(() => {
    basicRole = {
      name: RoleName.BasicUser,
    } as jest.Mocked<Role>

    proRole = {
      name: RoleName.ProUser,
    } as jest.Mocked<Role>

    coreRole = {
      name: RoleName.CoreUser,
    } as jest.Mocked<Role>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(proRole)

    roleToSubscriptionMap = {} as jest.Mocked<RoleToSubscriptionMapInterface>
    roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(RoleName.ProUser)

    offlineUserSubscription = {} as jest.Mocked<OfflineUserSubscription>
    offlineUserSubscription.roles = Promise.resolve([ coreRole ])

    offlineUserSubscriptionRepository = {} as jest.Mocked<OfflineUserSubscriptionRepositoryInterface>
    offlineUserSubscriptionRepository.findOneByEmail = jest.fn().mockReturnValue(offlineUserSubscription)
    offlineUserSubscriptionRepository.save = jest.fn().mockReturnValue(offlineUserSubscription)

    webSocketsClientService = {} as jest.Mocked<ClientServiceInterface>
    webSocketsClientService.sendUserRolesChangedEvent = jest.fn()

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  describe('adding roles', () => {
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

      expect(webSocketsClientService.sendUserRolesChangedEvent).toHaveBeenCalledWith(
        user,
      )
    })

    it('should not add role if no role name exists for subscription name', async () => {
      roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(undefined)

      await createService().addUserRole(user, 'test' as SubscriptionName)

      expect(userRepository.save).not.toHaveBeenCalled()
    })

    it('should not add role if no role exists for role name', async () => {
      roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)
      await createService().addUserRole(user, SubscriptionName.ProPlan)

      expect(userRepository.save).not.toHaveBeenCalled()
    })

    it('should add offline role to offline subscription', async () => {
      await createService().addOfflineUserRole('test@test.com', SubscriptionName.ProPlan)

      expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
      expect(offlineUserSubscriptionRepository.save).toHaveBeenCalledWith({
        roles: Promise.resolve([ coreRole, proRole ]),
      })
    })

    it('should not add offline role if no role name exists for subscription name', async () => {
      roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(undefined)

      await createService().addOfflineUserRole('test@test.com', 'test' as SubscriptionName)

      expect(offlineUserSubscriptionRepository.save).not.toHaveBeenCalled()
    })

    it('should not add offline role if no role exists for role name', async () => {
      roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)

      await createService().addOfflineUserRole('test@test.com', SubscriptionName.ProPlan)

      expect(offlineUserSubscriptionRepository.save).not.toHaveBeenCalled()
    })

    it('should not add offline role if no offline subscription is found', async () => {
      offlineUserSubscriptionRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

      await createService().addOfflineUserRole('test@test.com', SubscriptionName.ProPlan)

      expect(offlineUserSubscriptionRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('removing roles', () => {
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

      expect(webSocketsClientService.sendUserRolesChangedEvent).toHaveBeenCalledWith(
        user,
      )
    })

    it('should not add role if no role name exists for subscription name', async () => {
      roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(undefined)

      await createService().removeUserRole(user, 'test' as SubscriptionName)

      expect(userRepository.save).not.toHaveBeenCalled()
    })
  })
})
