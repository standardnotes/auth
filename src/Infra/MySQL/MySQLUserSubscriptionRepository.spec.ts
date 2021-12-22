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
      cancelled: false,
    } as jest.Mocked<UserSubscription>

    repository = new MySQLUserSubscriptionRepository()
    jest.spyOn(repository, 'createQueryBuilder')
  })

  it('should find one longest lasting uncanceled subscription by user uuid if there are canceled ones', async () => {
    const canceledSubscription = {
      planName: SubscriptionName.ProPlan,
      cancelled: true,
    } as jest.Mocked<UserSubscription>

    repository.createQueryBuilder = jest.fn().mockImplementation(() => selectQueryBuilder)

    selectQueryBuilder.where = jest.fn().mockReturnThis()
    selectQueryBuilder.orderBy = jest.fn().mockReturnThis()
    selectQueryBuilder.getMany = jest.fn().mockReturnValue([canceledSubscription, subscription])

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
    expect(selectQueryBuilder.getMany).toHaveBeenCalled()
    expect(result).toEqual(subscription)
  })

  it('should find one, longest lasting subscription by user uuid if there are no canceled ones', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => selectQueryBuilder)

    selectQueryBuilder.where = jest.fn().mockReturnThis()
    selectQueryBuilder.orderBy = jest.fn().mockReturnThis()
    selectQueryBuilder.getMany = jest.fn().mockReturnValue([subscription])

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
    expect(selectQueryBuilder.getMany).toHaveBeenCalled()
    expect(result).toEqual(subscription)
  })

  it('should find none if there are no subscriptions for the user', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => selectQueryBuilder)

    selectQueryBuilder.where = jest.fn().mockReturnThis()
    selectQueryBuilder.orderBy = jest.fn().mockReturnThis()
    selectQueryBuilder.getMany = jest.fn().mockReturnValue([])

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
    expect(selectQueryBuilder.getMany).toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should update ends at by subscription id', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => updateQueryBuilder)

    updateQueryBuilder.update = jest.fn().mockReturnThis()
    updateQueryBuilder.set = jest.fn().mockReturnThis()
    updateQueryBuilder.where = jest.fn().mockReturnThis()
    updateQueryBuilder.execute = jest.fn()

    await repository.updateEndsAt(1, 1000, 1000)

    expect(updateQueryBuilder.update).toHaveBeenCalled()
    expect(updateQueryBuilder.set).toHaveBeenCalledWith(
      {
        updatedAt: expect.any(Number),
        endsAt: 1000,
      }
    )
    expect(updateQueryBuilder.where).toHaveBeenCalledWith(
      'subscription_id = :subscriptionId',
      {
        subscriptionId: 1,
      }
    )
    expect(updateQueryBuilder.execute).toHaveBeenCalled()
  })

  it('should update cancelled by subscription id', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => updateQueryBuilder)

    updateQueryBuilder.update = jest.fn().mockReturnThis()
    updateQueryBuilder.set = jest.fn().mockReturnThis()
    updateQueryBuilder.where = jest.fn().mockReturnThis()
    updateQueryBuilder.execute = jest.fn()

    await repository.updateCancelled(1, true, 1000)

    expect(updateQueryBuilder.update).toHaveBeenCalled()
    expect(updateQueryBuilder.set).toHaveBeenCalledWith(
      {
        updatedAt: expect.any(Number),
        cancelled: true,
      }
    )
    expect(updateQueryBuilder.where).toHaveBeenCalledWith(
      'subscription_id = :subscriptionId',
      {
        subscriptionId: 1,
      }
    )
    expect(updateQueryBuilder.execute).toHaveBeenCalled()
  })
})
