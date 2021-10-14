import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { DashboardTokenRepositoryInterface } from '../../Auth/DashboardTokenRepositoryInterface'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { CreateDashboardTokenDTO } from './CreateDashboardTokenDTO'
import { CreateDashboardTokenResponse } from './CreateDashboardTokenResponse'

@injectable()
export class CreateDashboardToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.DashboardTokenRepository) private dashboardTokenRepository: DashboardTokenRepositoryInterface,
    @inject(TYPES.SnCryptoNode) private cryptoNode: SnCryptoNode,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: CreateDashboardTokenDTO): Promise<CreateDashboardTokenResponse> {
    const token = await this.cryptoNode.generateRandomKey(128)

    const dashboardToken = {
      userEmail: dto.userEmail,
      token,
      expiresAt: this.timer.convertStringDateToMicroseconds(
        this.timer.getUTCDateNDaysAhead(1).toString()
      ),
    }

    await this.dashboardTokenRepository.save(dashboardToken)

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createDashboardTokenCreatedEvent(token, dto.userEmail)
    )

    return {
      dashboardToken,
    }
  }
}
