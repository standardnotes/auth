import { UserSubscription } from './UserSubscription'

export interface UserSubscriptionRepositoryInterface {
  findOneByUserUuid(userUuid: string): Promise<UserSubscription | undefined>
  updateEndsAtByNameAndUserUuid(name: string, userUuid: string, endsAt: number, updatedAt: number): Promise<void>
  updateSubscriptionCancelled(name: string, userUuid: string, cancelled: boolean, updatedAt: number): Promise<void>
  save(subscription: UserSubscription): Promise<UserSubscription> 
}
