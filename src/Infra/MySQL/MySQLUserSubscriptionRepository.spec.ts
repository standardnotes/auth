import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'

import { SelectQueryBuilder, UpdateQueryBuilder } from 'typeorm'
import { UserSubscription } from '../../Domain/Subscription/UserSubscription'

import { MySQLUserSubscriptionRepository } from './MySQLUserSubscriptionRepository'

describe('MySQLUserSubscriptionRepository', () => {
  let repository: MySQLUserSubscriptionRepository
  let selectQueryBuilder: SelectQueryBuilder<UserSubscription>
  let updateQueryBuilder: UpdateQueryBuilder<UserSubscription>
  let subscription: UserSubscription

  beforeEach(() => {
    selectQueryBuilder = {} as jest.Mocked<SelectQueryBuilder<UserSubscription>>
    updateQueryBuilder = {} as jest.Mocked<UpdateQueryBuilder<UserSubscription>>

    subscription = {
      planName: SubscriptionName.ProPlan,
    } as jest.Mocked<UserSubscription>

    repository = new MySQLUserSubscriptionRepository()
    jest.spyOn(repository, 'createQueryBuilder')
  })

  it('should find one by user uuid', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => selectQueryBuilder)

    selectQueryBuilder.where = jest.fn().mockReturnThis()
    selectQueryBuilder.orderBy = jest.fn().mockReturnThis()
    selectQueryBuilder.getOne = jest.fn().mockReturnValue(subscription)

    const result = await repository.findOneByUserUuid('123')

    expect(selectQueryBuilder.where).toHaveBeenCalledWith(
      'user_uuid = :user_uuid',
      {
        user_uuid: '123',
      },
    )
    expect(selectQueryBuilder.orderBy).toHaveBeenCalledWith(
      'ends_at', 'DESC'
    )
    expect(selectQueryBuilder.getOne).toHaveBeenCalled()
    expect(result).toEqual(subscription)
  })

  it('should update ends at by name and user uuid', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => updateQueryBuilder)

    updateQueryBuilder.update = jest.fn().mockReturnThis()
    updateQueryBuilder.set = jest.fn().mockReturnThis()
    updateQueryBuilder.where = jest.fn().mockReturnThis()
    updateQueryBuilder.execute = jest.fn()

    await repository.updateEndsAtByNameAndUserUuid('test', '123', 1000, 1000)

    expect(updateQueryBuilder.update).toHaveBeenCalled()
    expect(updateQueryBuilder.set).toHaveBeenCalledWith(
      {
        updatedAt: expect.any(Number),
        endsAt: 1000,
      }
    )
    expect(updateQueryBuilder.where).toHaveBeenCalledWith(
      'plan_name = :plan_name AND user_uuid = :user_uuid',
      {
        plan_name: 'test',
        user_uuid: '123',
      }
    )
    expect(updateQueryBuilder.execute).toHaveBeenCalled()
  })

  it('should update cancelled by name and user uuid', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => updateQueryBuilder)

    updateQueryBuilder.update = jest.fn().mockReturnThis()
    updateQueryBuilder.set = jest.fn().mockReturnThis()
    updateQueryBuilder.where = jest.fn().mockReturnThis()
    updateQueryBuilder.execute = jest.fn()

    await repository.updateCancelled('test', '123', true, 1000)

    expect(updateQueryBuilder.update).toHaveBeenCalled()
    expect(updateQueryBuilder.set).toHaveBeenCalledWith(
      {
        updatedAt: expect.any(Number),
        cancelled: true,
      }
    )
    expect(updateQueryBuilder.where).toHaveBeenCalledWith(
      'plan_name = :plan_name AND user_uuid = :user_uuid',
      {
        plan_name: 'test',
        user_uuid: '123',
      }
    )
    expect(updateQueryBuilder.execute).toHaveBeenCalled()
  })
})
