import 'reflect-metadata'

import { RoleName, SubscriptionName } from '@standardnotes/common'

import { RoleToSubscriptionMap } from './RoleToSubscriptionMap'

describe('RoleToSubscriptionMap', () => {
  const createMap = () => new RoleToSubscriptionMap()

  it('should return subscription name for role name', () => {
    expect(createMap().getSubscriptionNameForRoleName(RoleName.ProUser)).toEqual(SubscriptionName.ProPlan)
  })

  it('should return role name for subscription name', () => {
    expect(createMap().getRoleNameForSubscriptionName(SubscriptionName.PlusPlan)).toEqual(RoleName.PlusUser)
  })

  it('should not return role name for subscription name that does not exist', () => {
    expect(createMap().getRoleNameForSubscriptionName('test' as SubscriptionName)).toEqual(undefined)
  })
})
