import { SubscriptionName } from '@standardnotes/auth'
import {
  DomainEventHandlerInterface,
  SubscriptionRefundedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'

@injectable()
export class SubscriptionRefundedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
    @inject(TYPES.RoleService) private roleService: RoleServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(
    event: SubscriptionRefundedEvent
  ): Promise<void> {
    if (event.payload.offline) {
      await this.updateOfflineSubscriptionEndsAt(
        event.payload.subscriptionId,
        event.payload.timestamp,
      )
      await this.removeOfflineUserRole(event.payload.userEmail, event.payload.subscriptionName)

      return
    }

    const user = await this.userRepository.findOneByEmail(
      event.payload.userEmail
    )

    if (user === undefined) {
      this.logger.warn(
        `Could not find user with email: ${event.payload.userEmail}`
      )
      return
    }

    await this.updateSubscriptionEndsAt(
      event.payload.subscriptionId,
      event.payload.timestamp,
    )
    await this.removeUserRole(user, event.payload.subscriptionName)
  }

  private async removeUserRole(
    user: User,
    subscriptionName: SubscriptionName
  ): Promise<void> {
    await this.roleService.removeUserRole(user, subscriptionName)
  }

  private async updateSubscriptionEndsAt(
    subscriptionId: number,
    timestamp: number,
  ): Promise<void> {
    await this.userSubscriptionRepository.updateEndsAt(
      subscriptionId,
      timestamp,
      timestamp,
    )
  }

  private async removeOfflineUserRole(
    email: string,
    subscriptionName: SubscriptionName
  ): Promise<void> {
    await this.roleService.removeOfflineUserRole(email, subscriptionName)
  }

  private async updateOfflineSubscriptionEndsAt(
    subscriptionId: number,
    timestamp: number,
  ): Promise<void> {
    await this.offlineUserSubscriptionRepository.updateEndsAt(
      subscriptionId,
      timestamp,
      timestamp,
    )
  }
}
