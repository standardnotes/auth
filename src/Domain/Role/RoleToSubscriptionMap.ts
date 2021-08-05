import { RoleName, SubscriptionName } from '@standardnotes/auth'

const roleNameToSubscriptionNameMap = new Map<RoleName, SubscriptionName>([
  [RoleName.CoreUser, SubscriptionName.CorePlan],
  [RoleName.PlusUser, SubscriptionName.PlusPlan],
  [RoleName.ProUser, SubscriptionName.ProPlan],
])

export const getSubscriptionNameForRoleName = (roleName: RoleName): SubscriptionName | undefined => {
  return roleNameToSubscriptionNameMap.get(roleName)
}

export const getRoleNameForSubscriptionName = (subscriptionName: SubscriptionName): RoleName | undefined => {
  for (const[roleNameItem, subscriptionNameItem] of roleNameToSubscriptionNameMap) {
    if (subscriptionNameItem === subscriptionName) {
      return roleNameItem
    }
  }
  return undefined
}
