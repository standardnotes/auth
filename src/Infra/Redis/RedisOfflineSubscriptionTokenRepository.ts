import * as IORedis from 'ioredis'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { OfflineSubscriptionToken } from '../../Domain/Auth/OfflineSubscriptionToken'
import { OfflineSubscriptionTokenRepositoryInterface } from '../../Domain/Auth/OfflineSubscriptionTokenRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class RedisOfflineSubscriptionTokenRepository implements OfflineSubscriptionTokenRepositoryInterface {
  private readonly PREFIX = 'offline-subscription-token'

  constructor(
    @inject(TYPES.Redis) private redisClient: IORedis.Redis,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async getUserEmailByToken(token: string): Promise<string | undefined> {
    const userUuid = await this.redisClient.get(`${this.PREFIX}:${token}`)
    if (!userUuid) {
      return undefined
    }

    return userUuid
  }

  async save(offlineSubscriptionToken: OfflineSubscriptionToken): Promise<void> {
    const key = `${this.PREFIX}:${offlineSubscriptionToken.token}`
    const expiresAtTimestampInSeconds = this.timer.convertMicrosecondsToSeconds(offlineSubscriptionToken.expiresAt)

    await this.redisClient.set(key, offlineSubscriptionToken.userEmail)
    await this.redisClient.expireat(key, expiresAtTimestampInSeconds)
  }
}
