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
import { PermissionName } from '@standardnotes/features'
import { Permission } from '../Permission/Permission'

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

  const createService = () => new RoleService(
    userRepository,
    roleRepository,
    offlineUserSubscriptionRepository,
    webSocketsClientService,
    roleToSubscriptionMap,
    logger,
  )

  beforeEach(() => {
    basicRole = {
      name: RoleName.BasicUser,
      permissions: Promise.resolve([
        {
          name: PermissionName.MarkdownBasicEditor,
        } as jest.Mocked<Permission>,
      ]),
    } as jest.Mocked<Role>

    proRole = {
      name: RoleName.ProUser,
      permissions: Promise.resolve([
        {
          name: PermissionName.DailyEmailBackup,
        } as jest.Mocked<Permission>,
      ]),
    } as jest.Mocked<Role>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(proRole)

    roleToSubscriptionMap = {} as jest.Mocked<RoleToSubscriptionMapInterface>
    roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(RoleName.ProUser)

    offlineUserSubscription = {
      endsAt: 100,
      cancelled: false,
      planName: SubscriptionName.ProPlan,
    } as jest.Mocked<OfflineUserSubscription>

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

    it('should not add duplicate role to user', async () => {
      user = {
        uuid: '123',
        email: 'test@test.com',
        roles: Promise.resolve([
          basicRole,
          proRole,
        ]),
      } as jest.Mocked<User>

      userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

      await createService().addUserRole(user, SubscriptionName.ProPlan)

      expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
      expect(userRepository.save).toHaveBeenCalledWith(user)
      expect(await user.roles).toHaveLength(2)
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
      await createService().addOfflineUserRole(offlineUserSubscription)

      expect(roleRepository.findOneByName).toHaveBeenCalledWith(RoleName.ProUser)
      expect(offlineUserSubscriptionRepository.save).toHaveBeenCalledWith({
        endsAt: 100,
        cancelled: false,
        planName: SubscriptionName.ProPlan,
        roles: Promise.resolve([ proRole ]),
      })
    })

    it('should not add offline role if no role name exists for subscription name', async () => {
      roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(undefined)

      await createService().addOfflineUserRole(offlineUserSubscription)

      expect(offlineUserSubscriptionRepository.save).not.toHaveBeenCalled()
    })

    it('should not add offline role if no role exists for role name', async () => {
      roleRepository.findOneByName = jest.fn().mockReturnValue(undefined)

      await createService().addOfflineUserRole(offlineUserSubscription)

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

      expect(userRepository.save).toHaveBeenCalledWith(user)
    })

    it('should send websockets event', async () => {
      await createService().removeUserRole(user, SubscriptionName.ProPlan)

      expect(webSocketsClientService.sendUserRolesChangedEvent).toHaveBeenCalledWith(
        user,
      )
    })

    it('should not remove role if role name does not exist for subscription name', async () => {
      roleToSubscriptionMap.getRoleNameForSubscriptionName = jest.fn().mockReturnValue(undefined)

      await createService().removeUserRole(user, 'test' as SubscriptionName)

      expect(userRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('checking permissions', () => {
    beforeEach(() => {
      user = {
        uuid: '123',
        email: 'test@test.com',
        roles: Promise.resolve([
          basicRole,
          proRole,
        ]),
      } as jest.Mocked<User>

      userRepository.findOneByUuid = jest.fn().mockReturnValue(user)
    })

    it('should indicate if a user has given permission', async () => {
      const userHasPermission = await createService().userHasPermission('1-2-3', PermissionName.DailyEmailBackup)

      expect(userHasPermission).toBeTruthy()
    })

    it('should indicate if a user does not have a given permission', async () => {
      const userHasPermission = await createService().userHasPermission('1-2-3', PermissionName.DailyGDriveBackup)

      expect(userHasPermission).toBeFalsy()
    })

    it('should indicate user does not have a permission if user could not be found', async () => {
      userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

      const userHasPermission = await createService().userHasPermission('1-2-3', PermissionName.DailyGDriveBackup)

      expect(userHasPermission).toBeFalsy()
    })
  })
})
