import { Uuid } from '@standardnotes/common'
import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'

import { UserSubscription } from '../../Domain/Subscription/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../../Domain/Subscription/UserSubscriptionRepositoryInterface'
import { UserSubscriptionType } from '../../Domain/Subscription/UserSubscriptionType'

@injectable()
@EntityRepository(UserSubscription)
export class MySQLUserSubscriptionRepository
  extends Repository<UserSubscription>
  implements UserSubscriptionRepositoryInterface
{
  async findOneByUserUuidAndSubscriptionId(
    userUuid: Uuid,
    subscriptionId: number,
  ): Promise<UserSubscription | undefined> {
    return await this.createQueryBuilder()
      .where('user_uuid = :userUuid AND subscription_id = :subscriptionId', {
        userUuid,
        subscriptionId,
      })
      .getOne()
  }

  async findBySubscriptionIdAndType(subscriptionId: number, type: UserSubscriptionType): Promise<UserSubscription[]> {
    return await this.createQueryBuilder()
      .where('subscription_id = :subscriptionId AND subscription_type = :type', {
        subscriptionId,
        type,
      })
      .getMany()
  }

  async findBySubscriptionId(subscriptionId: number): Promise<UserSubscription[]> {
    return await this.createQueryBuilder()
      .where('subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .getMany()
  }

  async findOneByUuid(uuid: Uuid): Promise<UserSubscription | undefined> {
    return await this.createQueryBuilder()
      .where('uuid = :uuid', {
        uuid,
      })
      .getOne()
  }

  async findOneByUserUuid(userUuid: Uuid): Promise<UserSubscription | undefined> {
    const subscriptions = await this.createQueryBuilder()
      .where('user_uuid = :user_uuid', {
        user_uuid: userUuid,
      })
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
      .where('subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .execute()
  }

  async updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({
        cancelled,
        updatedAt,
      })
      .where('subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .execute()
  }
}
