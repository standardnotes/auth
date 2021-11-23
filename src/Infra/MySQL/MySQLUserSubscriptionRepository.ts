import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'

import { UserSubscription } from '../../Domain/Subscription/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../../Domain/Subscription/UserSubscriptionRepositoryInterface'

@injectable()
@EntityRepository(UserSubscription)
export class MySQLUserSubscriptionRepository extends Repository<UserSubscription> implements UserSubscriptionRepositoryInterface {
  async findOneByUserUuid(userUuid: string): Promise<UserSubscription | undefined> {
    const subscriptions = await this.createQueryBuilder()
      .where(
        'user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
        }
      )
      .orderBy('ends_at', 'DESC')
      .getMany()

    const uncanceled = subscriptions.find((subscription) => !subscription.cancelled)
    return uncanceled || subscriptions[0]
  }

  async updateEndsAt(subscriptionId: number, endsAt: number, updatedAt: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({
        endsAt,
        updatedAt,
      })
      .where(
        'subscription_id = :subscriptionId',
        {
          subscriptionId,
        }
      )
      .execute()
  }

  async updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({
        cancelled,
        updatedAt,
      })
      .where(
        'subscription_id = :subscriptionId',
        {
          subscriptionId,
        }
      )
      .execute()
  }
}
