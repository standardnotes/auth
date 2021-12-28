import { UserSubscription } from './UserSubscription'

export interface UserSubscriptionRepositoryInterface {
  findOneByUserUuid(userUuid: string): Promise<UserSubscription | undefined>
  findOneBySubscriptionId(subscriptionId: number): Promise<UserSubscription | undefined>
  updateEndsAt(subscriptionId: number, endsAt: number, updatedAt: number): Promise<void>
  updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void>
  save(subscription: UserSubscription): Promise<UserSubscription>
}
