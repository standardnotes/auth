import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'

import { SelectQueryBuilder, UpdateQueryBuilder } from 'typeorm'

import { MySQLOfflineUserSubscriptionRepository } from './MySQLOfflineUserSubscriptionRepository'
import { OfflineUserSubscription } from '../../Domain/Subscription/OfflineUserSubscription'

describe('MySQLOfflineUserSubscriptionRepository', () => {
  let repository: MySQLOfflineUserSubscriptionRepository
  let selectQueryBuilder: SelectQueryBuilder<OfflineUserSubscription>
  let updateQueryBuilder: UpdateQueryBuilder<OfflineUserSubscription>
  let offlineSubscription: OfflineUserSubscription

  beforeEach(() => {
    selectQueryBuilder = {} as jest.Mocked<SelectQueryBuilder<OfflineUserSubscription>>
    updateQueryBuilder = {} as jest.Mocked<UpdateQueryBuilder<OfflineUserSubscription>>

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

  it('should find multiple by user email active after', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => selectQueryBuilder)

    selectQueryBuilder.where = jest.fn().mockReturnThis()
    selectQueryBuilder.orderBy = jest.fn().mockReturnThis()
    selectQueryBuilder.getMany = jest.fn().mockReturnValue([offlineSubscription])

    const result = await repository.findByEmail('test@test.com', 123)

    expect(selectQueryBuilder.where).toHaveBeenCalledWith(
      'email = :email AND ends_at > :endsAt',
      {
        email: 'test@test.com',
        endsAt: 123,
      },
    )
    expect(selectQueryBuilder.orderBy).toHaveBeenCalledWith(
      'ends_at', 'DESC'
    )
    expect(selectQueryBuilder.getMany).toHaveBeenCalled()
    expect(result).toEqual([offlineSubscription])
  })

  it('should update cancelled by name and user email', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => updateQueryBuilder)

    updateQueryBuilder.update = jest.fn().mockReturnThis()
    updateQueryBuilder.set = jest.fn().mockReturnThis()
    updateQueryBuilder.where = jest.fn().mockReturnThis()
    updateQueryBuilder.execute = jest.fn()

    await repository.updateCancelled('test', 'test@test.com', true, 1000)

    expect(updateQueryBuilder.update).toHaveBeenCalled()
    expect(updateQueryBuilder.set).toHaveBeenCalledWith(
      {
        updatedAt: expect.any(Number),
        cancelled: true,
      }
    )
    expect(updateQueryBuilder.where).toHaveBeenCalledWith(
      'plan_name = :plan_name AND email = :email',
      {
        plan_name: 'test',
        email: 'test@test.com',
      }
    )
    expect(updateQueryBuilder.execute).toHaveBeenCalled()
  })

  it('should update ends at by name and user email', async () => {
    repository.createQueryBuilder = jest.fn().mockImplementation(() => updateQueryBuilder)

    updateQueryBuilder.update = jest.fn().mockReturnThis()
    updateQueryBuilder.set = jest.fn().mockReturnThis()
    updateQueryBuilder.where = jest.fn().mockReturnThis()
    updateQueryBuilder.execute = jest.fn()

    await repository.updateEndsAtByNameAndEmail('test', 'test@test.com', 1000, 1000)

    expect(updateQueryBuilder.update).toHaveBeenCalled()
    expect(updateQueryBuilder.set).toHaveBeenCalledWith(
      {
        updatedAt: expect.any(Number),
        endsAt: 1000,
      }
    )
    expect(updateQueryBuilder.where).toHaveBeenCalledWith(
      'plan_name = :plan_name AND email = :email',
      {
        plan_name: 'test',
        email: 'test@test.com',
      }
    )
    expect(updateQueryBuilder.execute).toHaveBeenCalled()
  })
})
