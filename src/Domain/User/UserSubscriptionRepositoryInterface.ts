import { UserSubscription } from './UserSubscription'

export interface UserSubscriptionRepositoryInterface {
  updateEndsAtByNameAndUserUuid(name: string, userUuid: string, endsAt: number): Promise<void>
  save(subscription: UserSubscription): Promise<UserSubscription> 
}
