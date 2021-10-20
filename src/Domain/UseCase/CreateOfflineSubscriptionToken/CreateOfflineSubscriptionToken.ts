import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { OfflineSubscriptionTokenRepositoryInterface } from '../../Auth/OfflineSubscriptionTokenRepositoryInterface'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { CreateOfflineSubscriptionTokenDTO } from './CreateOfflineSubscriptionTokenDTO'
import { CreateOfflineSubscriptionTokenResponse } from './CreateOfflineSubscriptionTokenResponse'

@injectable()
export class CreateOfflineSubscriptionToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.OfflineSubscriptionTokenRepository) private offlineSubscriptionTokenRepository: OfflineSubscriptionTokenRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
    @inject(TYPES.SnCryptoNode) private cryptoNode: SnCryptoNode,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: CreateOfflineSubscriptionTokenDTO): Promise<CreateOfflineSubscriptionTokenResponse> {
    const existingSubscription = await this.offlineUserSubscriptionRepository.findOneByEmail(dto.userEmail)
    if (existingSubscription === undefined) {
      return {
        success: false,
        error: 'no-subscription',
      }
    }

    const token = await this.cryptoNode.generateRandomKey(128)

    const offlineSubscriptionToken = {
      userEmail: dto.userEmail,
      token,
      expiresAt: this.timer.convertStringDateToMicroseconds(
        this.timer.getUTCDateNHoursAhead(3).toString()
      ),
    }

    await this.offlineSubscriptionTokenRepository.save(offlineSubscriptionToken)

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createOfflineSubscriptionTokenCreatedEvent(token, dto.userEmail)
    )

    return {
      success: true,
      offlineSubscriptionToken,
    }
  }
}
