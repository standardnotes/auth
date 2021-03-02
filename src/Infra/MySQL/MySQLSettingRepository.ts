import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { Setting } from '../../Domain/Setting/Setting'
import { SettingRepositoryInterface } from '../../Domain/Setting/SettingRepositoryInterface'

@injectable()
@EntityRepository(Setting)
export class MySQLSettingRepository extends Repository<Setting> implements SettingRepositoryInterface {
  async findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined> {
    return this.createQueryBuilder('setting')
      .where(
        'setting.name = :name AND setting.user_uuid = :user_uuid',
        {
          name,
          user_uuid: userUuid,
        }
      )
      .getOne()
  }
}
