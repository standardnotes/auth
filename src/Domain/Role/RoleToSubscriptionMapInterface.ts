import { RoleName, SubscriptionName } from '@standardnotes/auth'

export interface RoleToSubscriptionMapInterface {
  getSubscriptionNameForRoleName(roleName: RoleName): SubscriptionName | undefined
  getRoleNameForSubscriptionName(subscriptionName: SubscriptionName): RoleName | undefined
}
