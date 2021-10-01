import * as IORedis from 'ioredis'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { EphemeralToken } from '../../Domain/Subscription/EphemeralToken'
import { EphemeralTokenRepositoryInterface } from '../../Domain/Subscription/EphemeralTokenRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class RedisEphemeralTokenRepository implements EphemeralTokenRepositoryInterface {
  private readonly PREFIX = 'token'

  constructor(
    @inject(TYPES.Redis) private redisClient: IORedis.Redis,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async getUserUuidByToken(token: string): Promise<string | undefined> {
    const userUuid = await this.redisClient.get(`${this.PREFIX}:${token}`)
    if (!userUuid) {
      return undefined
    }

    return userUuid
  }

  async save(ephemeralToken: EphemeralToken): Promise<void> {
    const key = `${this.PREFIX}:${ephemeralToken.token}`
    const expiresAtTimestampInSeconds = this.timer.convertMicrosecondsToSeconds(ephemeralToken.expiresAt)

    await this.redisClient.set(key, ephemeralToken.userUuid)
    await this.redisClient.expireat(key, expiresAtTimestampInSeconds)
  }
}
