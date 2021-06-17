import 'reflect-metadata'

import * as IORedis from 'ioredis'

import { RedisWebSocketsConnectionRepository } from './RedisWebSocketsConnectionRepository'

describe('RedisWebSocketsConnectionRepository', () => {
  let redisClient: IORedis.Redis

  const createRepository = () => new RedisWebSocketsConnectionRepository(redisClient)

  beforeEach(() => {
    redisClient = {} as jest.Mocked<IORedis.Redis>
    redisClient.sadd = jest.fn()
  })

  it('should save a connection to set of user connections', async () => {
    await createRepository().saveConnection('1-2-3', '2-3-4')

    expect(redisClient.sadd).toHaveBeenLastCalledWith('ws:1-2-3', '2-3-4')
  })
})
