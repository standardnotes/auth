import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { OfflineSetting } from '../../Domain/Setting/OfflineSetting'
import { OfflineSettingName } from '../../Domain/Setting/OfflineSettingName'
import { OfflineSettingRepositoryInterface } from '../../Domain/Setting/OfflineSettingRepositoryInterface'

@injectable()
@EntityRepository(OfflineSetting)
export class MySQLOfflineSettingRepository extends Repository<OfflineSetting> implements OfflineSettingRepositoryInterface {
  async findOneByNameAndValue(name: OfflineSettingName, value: string): Promise<OfflineSetting | undefined> {
    return this.createQueryBuilder('offline_setting')
      .where(
        'offline_setting.name = :name AND offline_setting.value = :value',
        {
          name,
          value,
        }
      )
      .getOne()
  }

  async findOneByNameAndEmail(name: OfflineSettingName, email: string): Promise<OfflineSetting | undefined> {
    return this.createQueryBuilder('offline_setting')
      .where(
        'offline_setting.name = :name AND offline_setting.email = :email',
        {
          name,
          email,
        }
      )
      .getOne()
  }
}
