import {
  DomainEventHandlerInterface,
  SubscriptionRenewedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { User } from '../User/User'
import { SubscriptionName } from '@standardnotes/common'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Logger } from 'winston'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'

@injectable()
export class SubscriptionRenewedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
    @inject(TYPES.RoleService) private roleService: RoleServiceInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(
    event: SubscriptionRenewedEvent
  ): Promise<void> {
    if (event.payload.offline) {
      const offlineUserSubscription = await this.offlineUserSubscriptionRepository
        .findOneBySubscriptionId(event.payload.subscriptionId)

      if (offlineUserSubscription === undefined) {
        this.logger.warn(`Could not find offline user subscription with id: ${event.payload.subscriptionId}`)

        return
      }

      await this.updateOfflineSubscriptionEndsAt(offlineUserSubscription, event.payload.timestamp)

      await this.roleService.setOfflineUserRole(offlineUserSubscription)

      return
    }

    await this.updateSubscriptionEndsAt(
      event.payload.subscriptionId,
      event.payload.subscriptionExpiresAt,
      event.payload.timestamp,
    )

    const user = await this.userRepository.findOneByEmail(event.payload.userEmail)

    if (user === undefined) {
      this.logger.warn(`Could not find user with email: ${event.payload.userEmail}`)

      return
    }

    await this.addUserRole(user, event.payload.subscriptionName)

    await this.settingService.applyDefaultSettingsForSubscription(user, event.payload.subscriptionName)
  }

  private async addUserRole(
    user: User,
    subscriptionName: SubscriptionName
  ): Promise<void> {
    await this.roleService.addUserRole(user, subscriptionName)
  }

  private async updateSubscriptionEndsAt(
    subscriptionId: number,
    subscriptionExpiresAt: number,
    timestamp: number,
  ): Promise<void> {
    await this.userSubscriptionRepository.updateEndsAt(
      subscriptionId,
      subscriptionExpiresAt,
      timestamp,
    )
  }

  private async updateOfflineSubscriptionEndsAt(
    offlineUserSubscription: OfflineUserSubscription,
    timestamp: number,
  ): Promise<void> {
    offlineUserSubscription.endsAt = timestamp
    offlineUserSubscription.updatedAt = timestamp

    await this.offlineUserSubscriptionRepository.save(offlineUserSubscription)
  }
}
