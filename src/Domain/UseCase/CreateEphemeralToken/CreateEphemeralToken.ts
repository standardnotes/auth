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
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async execute(dto: CreateEphemeralTokenDTO): Promise<CreateEphemeralTokenResponse> {
    const ephemeralToken = {
      userUuid: dto.userUuid,
      token: '',
      expiresAt: 1, // change with timer
    }

    await this.ephemeralTokenRepository.save(ephemeralToken)

    return {
      ephemeralToken,
    }
  }
}
