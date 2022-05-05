import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'

import { SubscriptionSetting } from '../../Domain/Setting/SubscriptionSetting'
import { SubscriptionSettingRepositoryInterface } from '../../Domain/Setting/SubscriptionSettingRepositoryInterface'

@injectable()
@EntityRepository(SubscriptionSetting)
export class MySQLSubscriptionSettingRepository
  extends Repository<SubscriptionSetting>
  implements SubscriptionSettingRepositoryInterface
{
  async findOneByUuid(uuid: string): Promise<SubscriptionSetting | undefined> {
    return this.createQueryBuilder('setting')
      .where('setting.uuid = :uuid', {
        uuid,
      })
      .getOne()
  }

  async findLastByNameAndUserSubscriptionUuid(
    name: string,
    userSubscriptionUuid: string,
  ): Promise<SubscriptionSetting | undefined> {
    const settings = await this.createQueryBuilder('setting')
      .where('setting.name = :name AND setting.user_subscription_uuid = :userSubscriptionUuid', {
        name,
        userSubscriptionUuid,
      })
      .orderBy('updated_at', 'DESC')
      .limit(1)
      .getMany()

    return settings.pop()
  }
}
