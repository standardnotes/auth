import { RoleName } from '@standardnotes/auth'
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

@injectable()
export class FeatureService implements FeatureServiceInterface {
  constructor(
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
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
    const userRoles = [...userRolesMap.values()]

    return this.getFeaturesForRoles(userRoles, userSubscriptions, offlineFeaturesToken)
  }

  async getFeaturesForUser(user: User): Promise<Array<FeatureDescription>> {
    const userRoles = await user.roles
    const userSubscriptions = await user.subscriptions

    let extensionKey = undefined
    const extensionKeySetting = await this.settingService.findSetting({
      settingName: SettingName.ExtensionKey,
      userUuid: user.uuid,
    })
    if (extensionKeySetting !== undefined) {
      extensionKey = extensionKeySetting.value as string
    }

    return this.getFeaturesForRoles(userRoles, userSubscriptions, extensionKey)
  }

  private injectExtensionKeyIntoUrl(url: string, extensionKey: string): string {
    if (!this.extensionServerUrl) {
      return url
    }

    return url.replace('#{url_prefix}', `${this.extensionServerUrl}/${extensionKey}`)
  }

  private async getFeaturesForRoles(userRoles: Array<Role>, userSubscriptions: Array<UserSubscription | OfflineUserSubscription>, extensionKey?: string): Promise<Array<FeatureDescription>> {
    const userFeatures: Map<string, FeatureDescription> = new Map()
    for (const role of userRoles) {
      const subscriptionName = this.roleToSubscriptionMap.getSubscriptionNameForRoleName(role.name as RoleName)
      const userSubscription = userSubscriptions.find(subscription => subscription.planName === subscriptionName)
      if (userSubscription === undefined) {
        continue
      }
      const expiresAt = userSubscription.endsAt

      const rolePermissions = await role.permissions

      for (const rolePermission of rolePermissions) {
        let featureForPermission = Features.find(feature => feature.permission_name === rolePermission.name) as FeatureDescription

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
            expires_at: expiresAt,
          })
          continue
        }

        if (expiresAt > (alreadyAddedFeature.expires_at as number)) {
          alreadyAddedFeature.expires_at = expiresAt
        }
      }
    }

    return [...userFeatures.values()]
  }
}
