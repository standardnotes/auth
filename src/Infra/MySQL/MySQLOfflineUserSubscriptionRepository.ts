import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { OfflineUserSubscription } from '../../Domain/Subscription/OfflineUserSubscription'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Domain/Subscription/OfflineUserSubscriptionRepositoryInterface'

@injectable()
@EntityRepository(OfflineUserSubscription)
export class MySQLOfflineUserSubscriptionRepository extends Repository<OfflineUserSubscription> implements OfflineUserSubscriptionRepositoryInterface {
  async findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined> {
    return await this.createQueryBuilder()
      .where(
        'email = :email',
        {
          email,
        }
      )
      .orderBy('ends_at', 'DESC')
      .getOne()
  }
}
