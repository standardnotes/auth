import { RoleName, SubscriptionName } from '@standardnotes/auth'

import { RoleToSubscriptionMapInterface } from './RoleToSubscriptionMapInterface'

export class RoleToSubscriptionMap implements RoleToSubscriptionMapInterface {
  private readonly roleNameToSubscriptionNameMap = new Map<RoleName, SubscriptionName>([
    [RoleName.CoreUser, SubscriptionName.CorePlan],
    [RoleName.PlusUser, SubscriptionName.PlusPlan],
    [RoleName.ProUser, SubscriptionName.ProPlan],
  ])

  getSubscriptionNameForRoleName(roleName: RoleName): SubscriptionName | undefined {
    return this.roleNameToSubscriptionNameMap.get(roleName)
  }

  getRoleNameForSubscriptionName(subscriptionName: SubscriptionName): RoleName | undefined {
    for (const[roleNameItem, subscriptionNameItem] of this.roleNameToSubscriptionNameMap) {
      if (subscriptionNameItem === subscriptionName) {
        return roleNameItem
      }
    }
    return undefined
  }
}
