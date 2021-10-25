import {
  DomainEventHandlerInterface,
  SubscriptionRenewedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'

@injectable()
export class SubscriptionRenewedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
  ) {
  }

  async handle(
    event: SubscriptionRenewedEvent
  ): Promise<void> {
    if (event.payload.offline) {
      await this.updateOfflineSubscriptionEndsAt(
        event.payload.subscriptionId,
        event.payload.timestamp,
      )

      return
    }

    await this.updateSubscriptionEndsAt(
      event.payload.subscriptionId,
      event.payload.subscriptionExpiresAt,
      event.payload.timestamp,
    )
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
