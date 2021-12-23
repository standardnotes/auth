import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { OfflineUserSubscription } from '../../Domain/Subscription/OfflineUserSubscription'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Domain/Subscription/OfflineUserSubscriptionRepositoryInterface'

@injectable()
@EntityRepository(OfflineUserSubscription)
export class MySQLOfflineUserSubscriptionRepository extends Repository<OfflineUserSubscription> implements OfflineUserSubscriptionRepositoryInterface {
  async findOneBySubscriptionId(subscriptionId: number): Promise<OfflineUserSubscription | undefined> {
    return await this.createQueryBuilder('offline_user_subscription')
      .where(
        'offline_user_subscription.subscription_id = :subscriptionId',
        {
          subscriptionId,
        }
      )
      .getOne()
  }

  async findByEmail(email: string, activeAfter: number): Promise<OfflineUserSubscription[]> {
    return await this.createQueryBuilder()
      .where(
        'email = :email AND ends_at > :endsAt',
        {
          email,
          endsAt: activeAfter,
        }
      )
      .orderBy('ends_at', 'DESC')
      .getMany()
  }

  async findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined> {
    const subscriptions = await this.createQueryBuilder()
      .where(
        'email = :email',
        {
          email,
        }
      )
      .orderBy('ends_at', 'DESC')
      .getMany()

    const uncanceled = subscriptions.find((subscription) => !subscription.cancelled)

    return uncanceled || subscriptions[0]
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
}
