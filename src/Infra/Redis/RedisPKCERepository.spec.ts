import 'reflect-metadata'

import * as IORedis from 'ioredis'

import { RedisPKCERepository } from './RedisPKCERepository'

describe('RedisPKCERepository', () => {
  let redisClient: IORedis.Redis

  const createRepository = () => new RedisPKCERepository(redisClient)

  beforeEach(() => {
    redisClient = {} as jest.Mocked<IORedis.Redis>
    redisClient.setex = jest.fn()
    redisClient.del = jest.fn().mockReturnValue(1)
  })

  it('should store a code challenge', async () => {
    await createRepository().storeCodeChallenge('test')

    expect(redisClient.setex).toHaveBeenCalledWith('pkce:test', 3600, 'test')
  })

  it('should remove a code challenge and notify of success', async () => {
    expect(await createRepository().removeCodeChallenge('test')).toBeTruthy()

    expect(redisClient.del).toHaveBeenCalledWith('pkce:test')
  })
})
