import { RoleName } from '@standardnotes/auth'
import { Feature, Features } from '@standardnotes/features'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'

import { User } from '../User/User'
import { UserSubscription } from '../User/UserSubscription'
import { FeatureServiceInterface } from './FeatureServiceInterface'

@injectable()
export class FeatureService implements FeatureServiceInterface {
  constructor(
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
  ) {
  }

  async getFeaturesForUser(user: User): Promise<Array<Feature>> {
    const userRoles = await user.roles
    const userSubscriptions = await user.subscriptions

    const userFeatures: Map<string, Feature> = new Map()
    for (const role of userRoles) {
      const subscriptionName = this.roleToSubscriptionMap.getSubscriptionNameForRoleName(role.name as RoleName)
      const expiresAt = (userSubscriptions.find(subscription => subscription.planName === subscriptionName) as UserSubscription).endsAt

      const rolePermissions = await role.permissions

      for (const rolePermission of rolePermissions) {
        const featureForPermission = Features.find(feature => feature.identifier === rolePermission.name) as Feature

        const alreadyAddedFeature = userFeatures.get(rolePermission.name)
        if (alreadyAddedFeature === undefined) {
          userFeatures.set(rolePermission.name, {
            ...featureForPermission,
            expiresAt,
          })
          continue
        }

        if (expiresAt > (alreadyAddedFeature.expiresAt as number)) {
          alreadyAddedFeature.expiresAt = expiresAt
        }
      }
    }

    return [...userFeatures.values()]
  }
}
