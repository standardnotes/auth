import * as IORedis from 'ioredis'

import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { LockRepositoryInterface } from '../../Domain/User/LockRepositoryInterface'

@injectable()
export class LockRepository implements LockRepositoryInterface {
  private readonly PREFIX = 'lock'

  constructor(
    @inject(TYPES.Redis) private redisClient: IORedis.Redis,
    @inject(TYPES.MAX_LOGIN_ATTEMPTS) private maxLoginAttempts: number,
    @inject(TYPES.FAILED_LOGIN_LOCKOUT) private failedLoginLockout: number
  ) {
  }

  async resetLockCounter(userIdentifier: string): Promise<void> {
    await this.redisClient.del(`${this.PREFIX}:${userIdentifier}`)
  }

  async updateLockCounter(userIdentifier: string, counter: number): Promise<void> {
    await this.redisClient.set(`${this.PREFIX}:${userIdentifier}`, counter)
  }

  async getLockCounter(userIdentifier: string): Promise<number> {
    const counter = await this.redisClient.get(`${this.PREFIX}:${userIdentifier}`)

    if (!counter) {
      return 0
    }

    return +counter
  }

  async lockUser(userIdentifier: string): Promise<void> {
    await this.redisClient.expire(`${this.PREFIX}:${userIdentifier}`, this.failedLoginLockout)
  }

  async isUserLocked(userIdentifier: string): Promise<boolean> {
    const counter = await this.getLockCounter(userIdentifier)

    return counter >= this.maxLoginAttempts
  }
}
