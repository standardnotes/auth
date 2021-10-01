import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { EphemeralTokenRepositoryInterface } from '../../Subscription/EphemeralTokenRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { CreateEphemeralTokenDTO } from './CreateEphemeralTokenDTO'
import { CreateEphemeralTokenResponse } from './CreateEphemeralTokenResponse'

@injectable()
export class CreateEphemeralToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.EphemeralTokenRepository) private ephemeralTokenRepository: EphemeralTokenRepositoryInterface,
    @inject(TYPES.SnCryptoNode) private cryptoNode: SnCryptoNode,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: CreateEphemeralTokenDTO): Promise<CreateEphemeralTokenResponse> {
    const token = await this.cryptoNode.generateRandomKey(128)

    const ephemeralToken = {
      userUuid: dto.userUuid,
      email: dto.email,
      token,
      expiresAt: this.timer.convertStringDateToMicroseconds(
        this.timer.getUTCDateNDaysAhead(1).toString()
      ),
    }

    await this.ephemeralTokenRepository.save(ephemeralToken)

    return {
      ephemeralToken,
    }
  }
}
