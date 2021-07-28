import { RoleName } from '@standardnotes/auth'
import {
  DomainEventHandlerInterface,
  SubscriptionRefundedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'
import { WebSocketsServiceInterface } from '../WebSockets/WebSocketsServiceInterface'

@injectable()
export class SubscriptionRefundedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.RoleRepository) private roleRepository: RoleRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.WebSocketsService) private webSocketsService: WebSocketsServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(
    event: SubscriptionRefundedEvent
  ): Promise<void> {
    const user = await this.userRepository.findOneByEmail(
      event.payload.userEmail
    )

    if (user === undefined) {
      this.logger.warn(
        `Could not find user with email: ${event.payload.userEmail}`
      )
      return
    }

    await this.updateUserRole(user)
    await this.updateSubscriptionEndsAt(
      event.payload.subscriptionName,
      user.uuid,
      event.payload.timestamp,
    )
  }

  private async updateUserRole(user: User): Promise<void> {
    const currentRoleName = (await user.roles)[0].name as RoleName
    const newRoleName = RoleName.CoreUser
    const newRole = await this.roleRepository.findOneByName(newRoleName)

    if (newRole === undefined) {
      this.logger.warn(`Could not find role for role name: ${RoleName.CoreUser}`)
      return
    }

    user.roles = Promise.resolve([newRole])
    await this.userRepository.save(user)
    await this.webSocketsService.sendUserRoleChangedEvent(
      user,
      currentRoleName,
      newRoleName
    )
  }

  private async updateSubscriptionEndsAt(
    subscriptionName: string,
    userUuid: string,
    timestamp: number,
  ): Promise<void> {
    await this.userSubscriptionRepository.updateEndsAtByNameAndUserUuid(
      subscriptionName,
      userUuid,
      timestamp,
    )
  }
}
