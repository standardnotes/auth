import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { ClientServiceInterface } from '../Client/ClientServiceInterface'
import { RoleRepositoryInterface } from './RoleRepositoryInterface'
import { RoleServiceInterface } from './RoleServiceInterface'

@injectable()
export class RoleService implements RoleServiceInterface {
  constructor(
    @inject(TYPES.UserRepository)
    private userRepository: UserRepositoryInterface,
    @inject(TYPES.RoleRepository)
    private roleRepository: RoleRepositoryInterface,
    @inject(TYPES.WebSocketsClientService)
    private webSocketsClientService: ClientServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async updateUserRole(
    user: User,
    fromSubscriptionName?: SubscriptionName,
    toSubscriptionName?: SubscriptionName
  ): Promise<void> {
    const newRoleName = toSubscriptionName
      ? this.subscriptionNameToRoleNameMap.get(toSubscriptionName)
      : RoleName.BasicUser

    if (newRoleName === undefined) {
      this.logger.warn(
        `Could not find role name for subscription name: ${toSubscriptionName}`
      )
      return
    }

    const roleToRemoveName = fromSubscriptionName
      ? this.subscriptionNameToRoleNameMap.get(fromSubscriptionName)
      : RoleName.BasicUser

    if (roleToRemoveName === undefined) {
      this.logger.warn(
        `Could not find role name for subscription name: ${fromSubscriptionName}`
      )
      return
    }

    const newRole = await this.roleRepository.findOneByName(newRoleName)

    if (newRole === undefined) {
      this.logger.warn(`Could not find role for role name: ${newRoleName}`)
      return
    }

    const currentRoles = await user.roles
    user.roles = Promise.resolve([
      ...currentRoles.filter((role) => role.name !== roleToRemoveName),
      newRole,
    ])
    await this.userRepository.save(user)
    await this.webSocketsClientService.sendUserRoleChangedEvent(
      user,
      newRoleName
    )
  }

  private subscriptionNameToRoleNameMap = new Map<SubscriptionName, RoleName>([
    [SubscriptionName.CorePlan, RoleName.CoreUser],
    [SubscriptionName.PlusPlan, RoleName.PlusUser],
    [SubscriptionName.ProPlan, RoleName.ProUser],
  ]);
}