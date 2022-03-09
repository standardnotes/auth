import { RoleName, SubscriptionName } from '@standardnotes/common'

export interface RoleToSubscriptionMapInterface {
  getSubscriptionNameForRoleName(roleName: RoleName): SubscriptionName | undefined
  getRoleNameForSubscriptionName(subscriptionName: SubscriptionName): RoleName | undefined
}
