import 'reflect-metadata'

import { Repository } from 'typeorm'

import { AnalyticsEntity } from '../../Domain/Analytics/AnalyticsEntity'

import { MySQLAnalyticsEntityRepository } from './MySQLAnalyticsEntityRepository'

describe('MySQLAnalyticsEntityRepository', () => {
  let ormRepository: Repository<AnalyticsEntity>
  let analyticsEntity: AnalyticsEntity

  const createRepository = () => new MySQLAnalyticsEntityRepository(ormRepository)

  beforeEach(() => {
    analyticsEntity = {} as jest.Mocked<AnalyticsEntity>

    ormRepository = {} as jest.Mocked<Repository<AnalyticsEntity>>
    ormRepository.save = jest.fn()
  })

  it('should save', async () => {
    await createRepository().save(analyticsEntity)

    expect(ormRepository.save).toHaveBeenCalledWith(analyticsEntity)
  })
})
