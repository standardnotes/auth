import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'

import { SelectQueryBuilder } from 'typeorm'

import { MySQLOfflineUserSubscriptionRepository } from './MySQLOfflineUserSubscriptionRepository'
import { OfflineUserSubscription } from '../../Domain/Subscription/OfflineUserSubscription'

describe('MySQLOfflineUserSubscriptionRepository', () => {
  let repository: MySQLOfflineUserSubscriptionRepository
  let selectQueryBuilder: SelectQueryBuilder<OfflineUserSubscription>
  let offlineSubscription: OfflineUserSubscription

  beforeEach(() => {
    selectQueryBuilder = {} as jest.Mocked<SelectQueryBuilder<OfflineUserSubscription>>

    offlineSubscription = {
      planName: SubscriptionName.ProPlan,
      email: 'test@test.com',
    } as jest.Mocked<OfflineUserSubscription>

    repository = new MySQLOfflineUserSubscriptionRepository()
    jest.spyOn(repository, 'createQueryBuilder')
  })

  it('should find one by user email', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => selectQueryBuilder)

    selectQueryBuilder.where = jest.fn().mockReturnThis()
    selectQueryBuilder.orderBy = jest.fn().mockReturnThis()
    selectQueryBuilder.getOne = jest.fn().mockReturnValue(offlineSubscription)

    const result = await repository.findOneByEmail('test@test.com')

    expect(selectQueryBuilder.where).toHaveBeenCalledWith(
      'email = :email',
      {
        email: 'test@test.com',
      },
    )
    expect(selectQueryBuilder.orderBy).toHaveBeenCalledWith(
      'ends_at', 'DESC'
    )
    expect(selectQueryBuilder.getOne).toHaveBeenCalled()
    expect(result).toEqual(offlineSubscription)
  })
})
