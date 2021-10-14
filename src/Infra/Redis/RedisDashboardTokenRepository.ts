import * as IORedis from 'ioredis'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { DashboardToken } from '../../Domain/Auth/DashboardToken'
import { DashboardTokenRepositoryInterface } from '../../Domain/Auth/DashboardTokenRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class RedisDashboardTokenRepository implements DashboardTokenRepositoryInterface {
  private readonly PREFIX = 'dashboard-token'

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

  async save(dashboardToken: DashboardToken): Promise<void> {
    const key = `${this.PREFIX}:${dashboardToken.token}`
    const expiresAtTimestampInSeconds = this.timer.convertMicrosecondsToSeconds(dashboardToken.expiresAt)

    await this.redisClient.set(key, dashboardToken.userEmail)
    await this.redisClient.expireat(key, expiresAtTimestampInSeconds)
  }
}
