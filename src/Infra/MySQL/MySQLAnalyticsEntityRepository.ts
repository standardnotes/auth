import { inject, injectable } from 'inversify'
import { Repository } from 'typeorm'

import TYPES from '../../Bootstrap/Types'
import { AnalyticsEntity } from '../../Domain/Analytics/AnalyticsEntity'
import { AnalyticsEntityRepositoryInterface } from '../../Domain/Analytics/AnalyticsEntityRepositoryInterface'

@injectable()
export class MySQLAnalyticsEntityRepository implements AnalyticsEntityRepositoryInterface {
  constructor(
    @inject(TYPES.ORMAnalyticsEntityRepository)
    private ormRepository: Repository<AnalyticsEntity>,
  ) {}

  async save(analyticsEntity: AnalyticsEntity): Promise<AnalyticsEntity> {
    return this.ormRepository.save(analyticsEntity)
  }
}
