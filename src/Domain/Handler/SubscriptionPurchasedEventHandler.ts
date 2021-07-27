import { RoleName, SubscriptionName } from '@standardnotes/auth'
import {
  DomainEventHandlerInterface,
  SubscriptionPurchasedEvent,
  SubscriptionRenewedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import * as dayjs from 'dayjs'

import TYPES from '../../Bootstrap/Types'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscription } from '../User/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'
import { WebSocketServiceInterface } from '../WebSockets/WebSocketsServiceInterface'

@injectable()
export class SubscriptionPurchasedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.RoleRepository) private roleRepository: RoleRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.WebSocketsService) private webSocketsService: WebSocketServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(
    event: SubscriptionPurchasedEvent | SubscriptionRenewedEvent
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
    )
    await this.updateUserRole(user, event.payload.subscriptionName)
  }

  private subscriptionNameToRoleNameMap = new Map<SubscriptionName, RoleName>([
    [SubscriptionName.CorePlan, RoleName.CoreUser],
    [SubscriptionName.PlusPlan, RoleName.PlusUser],
    [SubscriptionName.ProPlan, RoleName.ProUser],
  ]);

  private async updateUserRole(
    user: User,
    subscriptionName: SubscriptionName
  ): Promise<void> {
    const currentRoleName = (await user.roles)[0].name as RoleName
    const newRoleName = this.subscriptionNameToRoleNameMap.get(subscriptionName)

    if (newRoleName === undefined) {
      this.logger.warn(
        `Could not find role name for subscription name: ${subscriptionName}`
      )
      return
    }

    const role = await this.roleRepository.findOneByName(newRoleName)

    if (role === undefined) {
      this.logger.warn(`Could not find role for role name: ${newRoleName}`)
      return
    }

    user.roles = Promise.resolve([role])
    await this.userRepository.save(user)
    await this.webSocketsService.sendUserRoleChangedEvent(
      user,
      currentRoleName,
      newRoleName
    )
  }

  private async createSubscription(
    subscriptionName: string,
    user: User,
    subscriptionExpiresAt: number,
  ): Promise<void> {
    const subscription = new UserSubscription()
    subscription.planName = subscriptionName
    subscription.user = Promise.resolve(user)
    subscription.createdAt = dayjs.utc().valueOf()
    subscription.updatedAt = dayjs.utc().valueOf()
    subscription.endsAt = subscriptionExpiresAt

    await this.userSubscriptionRepository.save(subscription)
  }
}
