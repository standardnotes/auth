import * as IORedis from 'ioredis'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { WebSocketsConnectionRepositoryInterface } from '../../Domain/WebSockets/WebSocketsConnectionRepositoryInterface'

@injectable()
export class RedisWebSocketsConnectionRepository implements WebSocketsConnectionRepositoryInterface {
  private readonly PREFIX = 'ws'

  constructor(
    @inject(TYPES.Redis) private redisClient: IORedis.Redis
  ) {
  }

  async saveConnection (userUuid: string, connectionId: string): Promise<void> {
    await this.redisClient.sadd(`${this.PREFIX}:${userUuid}`, connectionId)
  }
}
