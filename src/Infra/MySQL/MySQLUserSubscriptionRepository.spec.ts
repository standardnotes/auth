import 'reflect-metadata'

import { UpdateQueryBuilder } from 'typeorm'
import { UserSubscription } from '../../Domain/User/UserSubscription'

import { MySQLUserSubscriptionRepository } from './MySQLUserSubscriptionRepository'

describe('MySQLUserSubscriptionRepository', () => {
  let repository: MySQLUserSubscriptionRepository
  let queryBuilder: UpdateQueryBuilder<UserSubscription>

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<UpdateQueryBuilder<UserSubscription>>

    repository = new MySQLUserSubscriptionRepository()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should update ends at by name and user uuid', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)

    queryBuilder.update = jest.fn().mockReturnThis()
    queryBuilder.set = jest.fn().mockReturnThis()
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.execute = jest.fn()

    await repository.updateEndsAtByNameAndUserUuid('test', '123', 1000, 1000)

    expect(queryBuilder.update).toHaveBeenCalled()
    expect(queryBuilder.set).toHaveBeenCalledWith(
      {
        endsAt: 1000,
        updatedAt: 1000,
      }
    )
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'plan_name = :plan_name AND user_uuid = :user_uuid',
      {
        plan_name: 'test',
        user_uuid: '123',
      }
    )
    expect(queryBuilder.execute).toHaveBeenCalled()
  })
})
