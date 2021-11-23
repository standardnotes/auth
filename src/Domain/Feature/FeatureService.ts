import { SubscriptionName } from '@standardnotes/auth'
import { FeatureDescription, Features } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

import { User } from '../User/User'
import { UserSubscription } from '../Subscription/UserSubscription'
import { FeatureServiceInterface } from './FeatureServiceInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { Role } from '../Role/Role'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'
import { TimerInterface } from '@standardnotes/time'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'

@injectable()
export class FeatureService implements FeatureServiceInterface {
  constructor(
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.RoleRepository) private roleRepository: RoleRepositoryInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
    @inject(TYPES.EXTENSION_SERVER_URL) private extensionServerUrl: string,
  ) {
  }

  async getFeaturesForOfflineUser(email: string, offlineFeaturesToken: string): Promise<FeatureDescription[]> {
    const userSubscriptions = await this.offlineUserSubscriptionRepository.findByEmail(email, this.timer.getTimestampInMicroseconds())
    const userRolesMap: Map<string, Role> = new Map()
    for (const userSubscription of userSubscriptions) {
      const subscriptionRoles = await userSubscription.roles
      for (const subscriptionRole of subscriptionRoles) {
        userRolesMap.set(subscriptionRole.name, subscriptionRole)
      }
    }

    return this.getFeaturesForSubscriptions(userSubscriptions, offlineFeaturesToken)
  }

  async getFeaturesForUser(user: User): Promise<Array<FeatureDescription>> {
    const userSubscriptions = await user.subscriptions

    let extensionKey = undefined
    const extensionKeySetting = await this.settingService.findSetting({
      settingName: SettingName.ExtensionKey,
      userUuid: user.uuid,
    })
    if (extensionKeySetting !== undefined) {
      extensionKey = extensionKeySetting.value as string
    }

    return this.getFeaturesForSubscriptions(userSubscriptions, extensionKey)
  }

  private injectExtensionKeyIntoUrl(url: string, extensionKey: string): string {
    return url.replace('#{url_prefix}', `${this.extensionServerUrl}/${extensionKey}`)
  }

  private async getFeaturesForSubscriptions(userSubscriptions: Array<UserSubscription | OfflineUserSubscription>, extensionKey?: string): Promise<Array<FeatureDescription>> {
    const userFeatures: Map<string, FeatureDescription> = new Map()
    const userSubscriptionNames: Array<SubscriptionName> = []

    userSubscriptions.map((userSubscription: UserSubscription) => {
      const subscriptionName = userSubscription.planName as SubscriptionName
      if (!userSubscriptionNames.includes(subscriptionName)) {
        userSubscriptionNames.push(subscriptionName)
      }
    })

    for (const userSubscriptionName of userSubscriptionNames) {
      const roleName = this.roleToSubscriptionMap.getRoleNameForSubscriptionName(userSubscriptionName)
      if (roleName === undefined) {
        continue
      }
      const role = await this.roleRepository.findOneByName(roleName)
      if (role === undefined) {
        continue
      }

      const longestLastingSubscription = this.getLongestLastingSubscription(userSubscriptions, userSubscriptionName)

      const rolePermissions = await role.permissions

      for (const rolePermission of rolePermissions) {
        let featureForPermission = Features.find(feature => feature.permission_name === rolePermission.name) as FeatureDescription
        const needsUrlReplace = featureForPermission.url?.includes('#{url_prefix}')
        if (needsUrlReplace && (!this.extensionServerUrl || !extensionKey)) {
          continue
        }

        if (extensionKey !== undefined) {
          featureForPermission = {
            ...featureForPermission,
            url: this.injectExtensionKeyIntoUrl(featureForPermission.url, extensionKey),
          }
        }

        const alreadyAddedFeature = userFeatures.get(rolePermission.name)
        if (alreadyAddedFeature === undefined) {
          userFeatures.set(rolePermission.name, {
            ...featureForPermission,
            expires_at: longestLastingSubscription.endsAt,
            role_name: roleName,
          })

          continue
        }

        if (longestLastingSubscription.endsAt > (alreadyAddedFeature.expires_at as number)) {
          alreadyAddedFeature.expires_at = longestLastingSubscription.endsAt
        }
      }
    }

    return [...userFeatures.values()]
  }

  private getLongestLastingSubscription(userSubscriptions: Array<UserSubscription | OfflineUserSubscription>, subscriptionName?: SubscriptionName) {
    return userSubscriptions
      .filter(subscription => subscription.planName === subscriptionName)
      .sort((a, b) => {
        if (a.endsAt < b.endsAt) { return 1 }
        if (a.endsAt > b.endsAt) { return -1 }
        return 0
      })[0]
  }
}
