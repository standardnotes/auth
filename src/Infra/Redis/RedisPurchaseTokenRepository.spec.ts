import 'reflect-metadata'

import * as IORedis from 'ioredis'
import { TimerInterface } from '@standardnotes/time'

import { RedisPurchaseTokenRepository } from './RedisPurchaseTokenRepository'
import { PurchaseToken } from '../../Domain/Subscription/PurchaseToken'

describe('RedisPurchaseTokenRepository', () => {
  let redisClient: IORedis.Redis
  let timer: TimerInterface

  const createRepository = () => new RedisPurchaseTokenRepository(redisClient, timer)

  beforeEach(() => {
    redisClient = {} as jest.Mocked<IORedis.Redis>
    redisClient.set = jest.fn()
    redisClient.get = jest.fn()
    redisClient.expireat = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertMicrosecondsToSeconds = jest.fn().mockReturnValue(1)
  })

  it('should get a user uuid in exchange for an purchase token', async () => {
    redisClient.get = jest.fn().mockReturnValue('1-2-3')

    expect(await createRepository().getUserUuidByToken('random-string')).toEqual('1-2-3')

    expect(redisClient.get).toHaveBeenCalledWith(
      'purchase-token:random-string',
    )
  })

  it('should return undefined if a user uuid is not exchanged for an purchase token', async () => {
    redisClient.get = jest.fn().mockReturnValue(null)

    expect(await createRepository().getUserUuidByToken('random-string')).toBeUndefined()

    expect(redisClient.get).toHaveBeenCalledWith(
      'purchase-token:random-string',
    )
  })

  it('should save an purchase token', async () => {
    const purchaseToken: PurchaseToken = {
      userUuid: '1-2-3',
      token: 'random-string',
      expiresAt: 123,
    }

    await createRepository().save(purchaseToken)

    expect(redisClient.set).toHaveBeenCalledWith(
      'purchase-token:random-string',
      '1-2-3',
    )

    expect(redisClient.expireat).toHaveBeenCalledWith(
      'purchase-token:random-string',
      1,
    )
  })
})
