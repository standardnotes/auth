import { SubscriptionName } from '@standardnotes/auth'
import {
  DomainEventHandlerInterface,
  SubscriptionPurchasedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscription } from '../Subscription/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'

@injectable()
export class SubscriptionPurchasedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.RoleService) private roleService: RoleServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(
    event: SubscriptionPurchasedEvent
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

    await this.createSubscription(
      event.payload.subscriptionName,
      user,
      event.payload.subscriptionExpiresAt,
      event.payload.timestamp,
    )

    await this.addUserRole(user, event.payload.subscriptionName)
  }

  private async addUserRole(
    user: User,
    subscriptionName: SubscriptionName
  ): Promise<void> {
    await this.roleService.addUserRole(user, subscriptionName)
  }

  private async createSubscription(
    subscriptionName: string,
    user: User,
    subscriptionExpiresAt: number,
    timestamp: number,
  ): Promise<void> {
    const subscription = new UserSubscription()
    subscription.planName = subscriptionName
    subscription.user = Promise.resolve(user)
    subscription.createdAt = timestamp
    subscription.updatedAt = timestamp
    subscription.endsAt = subscriptionExpiresAt
    subscription.cancelled = false

    await this.userSubscriptionRepository.save(subscription)
  }
}
