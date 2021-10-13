import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { OfflineUserSubscription } from '../../Domain/Subscription/OfflineUserSubscription'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Domain/Subscription/OfflineUserSubscriptionRepositoryInterface'

@injectable()
@EntityRepository(OfflineUserSubscription)
export class MySQLOfflineUserSubscriptionRepository extends Repository<OfflineUserSubscription> implements OfflineUserSubscriptionRepositoryInterface {
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

  async updateCancelled(name: string, email: string, cancelled: boolean, updatedAt: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({
        cancelled,
        updatedAt,
      })
      .where(
        'plan_name = :plan_name AND email = :email',
        {
          plan_name: name,
          email,
        }
      )
      .execute()
  }

  async updateEndsAtByNameAndEmail(name: string, email: string, endsAt: number, updatedAt: number): Promise<void> {
    await this.createQueryBuilder()
      .update()
      .set({
        endsAt,
        updatedAt,
      })
      .where(
        'plan_name = :plan_name AND email = :email',
        {
          plan_name: name,
          email: email,
        }
      )
      .execute()
  }
}
