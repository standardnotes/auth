import { SubscriptionName } from '@standardnotes/auth'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'
import { User } from '../User/User'

export interface RoleServiceInterface {
  addUserRole(user: User, subscriptionName: SubscriptionName): Promise<void>
  setOfflineUserRole(offlineUserSubscription: OfflineUserSubscription): Promise<void>
  removeUserRole(user: User, subscriptionName: SubscriptionName): Promise<void>
}
