import { SubscriptionName } from '@standardnotes/auth'
import { PermissionName } from '@standardnotes/features'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'
import { User } from '../User/User'

export interface RoleServiceInterface {
  addUserRole(user: User, subscriptionName: SubscriptionName): Promise<void>
  addOfflineUserRole(offlineUserSubscription: OfflineUserSubscription): Promise<void>
  removeUserRole(user: User, subscriptionName: SubscriptionName): Promise<void>
  userHasPermission(userUuid: string, permissionName: PermissionName): Promise<boolean>
}
