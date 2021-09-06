import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'

import { UserSubscription } from '../../Domain/User/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../../Domain/User/UserSubscriptionRepositoryInterface'

@injectable()
@EntityRepository(UserSubscription)
export class MySQLUserSubscriptionRepository extends Repository<UserSubscription> implements UserSubscriptionRepositoryInterface {
  async findOneByUserUuid(userUuid: string): Promise<UserSubscription | undefined> {
    return await this.createQueryBuilder()
      .where(
        'user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
        }
      )
      .orderBy('ends_at', 'DESC')
      .getOne()
  }

  async updateEndsAtByNameAndUserUuid(name: string, userUuid: string, endsAt: number, updatedAt: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({
        endsAt,
        updatedAt,
      })
      .where(
        'plan_name = :plan_name AND user_uuid = :user_uuid',
        {
          plan_name: name,
          user_uuid: userUuid,
        }
      )
      .execute()
  }
}
