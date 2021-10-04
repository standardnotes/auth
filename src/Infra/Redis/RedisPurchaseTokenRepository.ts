import * as IORedis from 'ioredis'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { PurchaseToken } from '../../Domain/Subscription/PurchaseToken'
import { PurchaseTokenRepositoryInterface } from '../../Domain/Subscription/PurchaseTokenRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class RedisPurchaseTokenRepository implements PurchaseTokenRepositoryInterface {
  private readonly PREFIX = 'purchase-token'

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

  async save(purchaseToken: PurchaseToken): Promise<void> {
    const key = `${this.PREFIX}:${purchaseToken.token}`
    const expiresAtTimestampInSeconds = this.timer.convertMicrosecondsToSeconds(purchaseToken.expiresAt)

    await this.redisClient.set(key, purchaseToken.userUuid)
    await this.redisClient.expireat(key, expiresAtTimestampInSeconds)
  }
}
