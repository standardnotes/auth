import { SubscriptionName } from '@standardnotes/auth'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { ClientServiceInterface } from '../Client/ClientServiceInterface'
import { RoleRepositoryInterface } from './RoleRepositoryInterface'
import { RoleServiceInterface } from './RoleServiceInterface'
import { RoleToSubscriptionMapInterface } from './RoleToSubscriptionMapInterface'

@injectable()
export class RoleService implements RoleServiceInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.RoleRepository) private roleRepository: RoleRepositoryInterface,
    @inject(TYPES.WebSocketsClientService) private webSocketsClientService: ClientServiceInterface,
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async addUserRole(
    user: User,
    subscriptionName: SubscriptionName,
  ): Promise<void> {
    const roleName = this.roleToSubscriptionMap.getRoleNameForSubscriptionName(subscriptionName)

    if (roleName === undefined) {
      this.logger.warn(
        `Could not find role name for subscription name: ${subscriptionName}`
      )
      return
    }

    const role = await this.roleRepository.findOneByName(roleName)

    if (role === undefined) {
      this.logger.warn(`Could not find role for role name: ${roleName}`)
      return
    }

    const currentRoles = await user.roles
    user.roles = Promise.resolve([
      ...currentRoles,
      role,
    ])
    await this.userRepository.save(user)
    await this.webSocketsClientService.sendUserRoleChangedEvent(
      user,
      roleName
    )
  }

  async removeUserRole(
    user: User,
    subscriptionName: SubscriptionName,
  ): Promise<void> {
    const roleName = this.roleToSubscriptionMap.getRoleNameForSubscriptionName(subscriptionName)

    if (roleName === undefined) {
      this.logger.warn(
        `Could not find role name for subscription name: ${subscriptionName}`
      )
      return
    }

    const currentRoles = await user.roles
    user.roles = Promise.resolve(
      currentRoles.filter(role => role.name !== roleName)
    )
    await this.userRepository.save(user)
    await this.webSocketsClientService.sendUserRoleChangedEvent(
      user,
      roleName
    )
  }
}
