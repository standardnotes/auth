import 'reflect-metadata'

import * as IORedis from 'ioredis'
import { TimerInterface } from '@standardnotes/time'

import { RedisEphemeralTokenRepository } from './RedisEphemeralTokenRepository'
import { EphemeralToken } from '../../Domain/Subscription/EphemeralToken'

describe('RedisEphemeralTokenRepository', () => {
  let redisClient: IORedis.Redis
  let timer: TimerInterface

  const createRepository = () => new RedisEphemeralTokenRepository(redisClient, timer)

  beforeEach(() => {
    redisClient = {} as jest.Mocked<IORedis.Redis>
    redisClient.set = jest.fn()
    redisClient.expireat = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertMicrosecondsToSeconds = jest.fn().mockReturnValue(1)
  })

  it('should save an ephemeral token', async () => {
    const ephemeralToken: EphemeralToken = {
      userUuid: '1-2-3',
      email: 'test@test.te',
      token: 'random-string',
      expiresAt: 123,
    }

    await createRepository().save(ephemeralToken)

    expect(redisClient.set).toHaveBeenCalledWith(
      'token:random-string',
      '1-2-3',
    )

    expect(redisClient.expireat).toHaveBeenCalledWith(
      'token:random-string',
      1,
    )
  })
})
