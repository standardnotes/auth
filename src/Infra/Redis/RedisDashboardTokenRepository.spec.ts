import 'reflect-metadata'

import * as IORedis from 'ioredis'
import { TimerInterface } from '@standardnotes/time'

import { RedisDashboardTokenRepository } from './RedisDashboardTokenRepository'
import { DashboardToken } from '../../Domain/Auth/DashboardToken'

describe('RedisDashboardTokenRepository', () => {
  let redisClient: IORedis.Redis
  let timer: TimerInterface

  const createRepository = () => new RedisDashboardTokenRepository(redisClient, timer)

  beforeEach(() => {
    redisClient = {} as jest.Mocked<IORedis.Redis>
    redisClient.set = jest.fn()
    redisClient.get = jest.fn()
    redisClient.expireat = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertMicrosecondsToSeconds = jest.fn().mockReturnValue(1)
  })

  it('should get a user uuid in exchange for an dashboard token', async () => {
    redisClient.get = jest.fn().mockReturnValue('test@test.com')

    expect(await createRepository().getUserEmailByToken('random-string')).toEqual('test@test.com')

    expect(redisClient.get).toHaveBeenCalledWith(
      'dashboard-token:random-string',
    )
  })

  it('should return undefined if a user uuid is not exchanged for an dashboard token', async () => {
    redisClient.get = jest.fn().mockReturnValue(null)

    expect(await createRepository().getUserEmailByToken('random-string')).toBeUndefined()

    expect(redisClient.get).toHaveBeenCalledWith(
      'dashboard-token:random-string',
    )
  })

  it('should save an dashboard token', async () => {
    const dashboardToken: DashboardToken = {
      userEmail: 'test@test.com',
      token: 'random-string',
      expiresAt: 123,
    }

    await createRepository().save(dashboardToken)

    expect(redisClient.set).toHaveBeenCalledWith(
      'dashboard-token:random-string',
      'test@test.com',
    )

    expect(redisClient.expireat).toHaveBeenCalledWith(
      'dashboard-token:random-string',
      1,
    )
  })
})
