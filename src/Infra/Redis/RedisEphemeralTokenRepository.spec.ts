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
    redisClient.get = jest.fn()
    redisClient.expireat = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertMicrosecondsToSeconds = jest.fn().mockReturnValue(1)
  })

  it('should get a user uuid in exchange for an ephemeral token', async () => {
    redisClient.get = jest.fn().mockReturnValue('1-2-3')

    expect(await createRepository().getUserUuidByToken('random-string')).toEqual('1-2-3')

    expect(redisClient.get).toHaveBeenCalledWith(
      'token:random-string',
    )
  })

  it('should return undefined if a user uuid is not exchanged for an ephemeral token', async () => {
    redisClient.get = jest.fn().mockReturnValue(null)

    expect(await createRepository().getUserUuidByToken('random-string')).toBeUndefined()

    expect(redisClient.get).toHaveBeenCalledWith(
      'token:random-string',
    )
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
