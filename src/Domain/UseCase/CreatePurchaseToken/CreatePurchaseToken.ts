import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { PurchaseTokenRepositoryInterface } from '../../Subscription/PurchaseTokenRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { CreatePurchaseTokenDTO } from './CreatePurchaseTokenDTO'
import { CreatePurchaseTokenResponse } from './CreatePurchaseTokenResponse'

@injectable()
export class CreatePurchaseToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.PurchaseTokenRepository) private purchaseTokenRepository: PurchaseTokenRepositoryInterface,
    @inject(TYPES.SnCryptoNode) private cryptoNode: SnCryptoNode,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: CreatePurchaseTokenDTO): Promise<CreatePurchaseTokenResponse> {
    const token = await this.cryptoNode.generateRandomKey(128)

    const purchaseToken = {
      userUuid: dto.userUuid,
      token,
      expiresAt: this.timer.convertStringDateToMicroseconds(
        this.timer.getUTCDateNDaysAhead(1).toString()
      ),
    }

    await this.purchaseTokenRepository.save(purchaseToken)

    return {
      purchaseToken,
    }
  }
}
