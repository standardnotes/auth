import { Uuid } from '@standardnotes/common'
import { UserSubscription } from './UserSubscription'
import { UserSubscriptionType } from './UserSubscriptionType'

export interface UserSubscriptionRepositoryInterface {
  findOneByUuid(uuid: Uuid): Promise<UserSubscription | undefined>
  findOneByUserUuid(userUuid: Uuid): Promise<UserSubscription | undefined>
  findOneByUserUuidAndSubscriptionId(userUuid: Uuid, subscriptionId: number): Promise<UserSubscription | undefined>
  findBySubscriptionIdAndType(subscriptionId: number, type: UserSubscriptionType): Promise<UserSubscription[]>
  findBySubscriptionId(subscriptionId: number): Promise<UserSubscription[]>
  updateEndsAt(subscriptionId: number, endsAt: number, updatedAt: number): Promise<void>
  updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void>
  save(subscription: UserSubscription): Promise<UserSubscription>
}
