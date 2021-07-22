import {
  DomainEventHandlerInterface,
  SubscriptionPurchasedEvent,
  SubscriptionRenewedEvent,
} from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'

@injectable()
export class SubscriptionRenewedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
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

    await this.updateSubscriptionEndsAt(
      event.payload.subscriptionName,
      user.uuid,
      event.payload.subscriptionExpiresAt,
      event.payload.timestamp,
    )
  }

  private async updateSubscriptionEndsAt(
    subscriptionName: string,
    userUuid: string,
    subscriptionExpiresAt: number,
    timestamp: number,
  ): Promise<void> {
    await this.userSubscriptionRepository.updateEndsAtByNameAndUserUuid(
      subscriptionName,
      userUuid,
      subscriptionExpiresAt,
      timestamp,
    )
  }
}
