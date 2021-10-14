import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { SubscriptionTokenRepositoryInterface } from '../../Subscription/SubscriptionTokenRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { CreateSubscriptionTokenDTO } from './CreateSubscriptionTokenDTO'
import { CreateSubscriptionTokenResponse } from './CreateSubscriptionTokenResponse'

@injectable()
export class CreateSubscriptionToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.SubscriptionTokenRepository) private subscriptionTokenRepository: SubscriptionTokenRepositoryInterface,
    @inject(TYPES.SnCryptoNode) private cryptoNode: SnCryptoNode,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: CreateSubscriptionTokenDTO): Promise<CreateSubscriptionTokenResponse> {
    const token = await this.cryptoNode.generateRandomKey(128)

    const subscriptionToken = {
      userUuid: dto.userUuid,
      token,
      expiresAt: this.timer.convertStringDateToMicroseconds(
        this.timer.getUTCDateNDaysAhead(1).toString()
      ),
    }

    await this.subscriptionTokenRepository.save(subscriptionToken)

    return {
      subscriptionToken,
    }
  }
}
