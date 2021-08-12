import { RoleName } from '@standardnotes/auth'
import { Feature, Features } from '@standardnotes/features'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { Setting } from '../Setting/Setting'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

import { User } from '../User/User'
import { UserSubscription } from '../User/UserSubscription'
import { FeatureServiceInterface } from './FeatureServiceInterface'

@injectable()
export class FeatureService implements FeatureServiceInterface {
  constructor(
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.EXTENSION_SERVER_URL) private extensionServerUrl: string,
  ) {
  }

  async getFeaturesForUser(user: User): Promise<Array<Feature>> {
    const userRoles = await user.roles
    const userSubscriptions = await user.subscriptions

    const extensionKeySetting = await this.settingService.findSetting({
      settingName: SettingName.ExtensionKey,
      userUuid: user.uuid,
    })

    const userFeatures: Map<string, Feature> = new Map()
    for (const role of userRoles) {
      const subscriptionName = this.roleToSubscriptionMap.getSubscriptionNameForRoleName(role.name as RoleName)
      const userSubscription = userSubscriptions.find(subscription => subscription.planName === subscriptionName) as UserSubscription
      if (userSubscription === undefined) {
        continue
      }
      const expiresAt = userSubscription.endsAt

      const rolePermissions = await role.permissions

      for (const rolePermission of rolePermissions) {
        let featureForPermission = Features.find(feature => feature.identifier === rolePermission.name) as Feature

        if (extensionKeySetting !== undefined) {
          featureForPermission = {
            ...featureForPermission,
            url: this.injectExtensionKeyIntoUrl(featureForPermission.url, extensionKeySetting),
          }
        }

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

  private injectExtensionKeyIntoUrl(url: string, extensionKeySetting: Setting): string {
    if (!this.extensionServerUrl) {
      return url
    }

    return url.replace('#{url_prefix}', `${this.extensionServerUrl}/${extensionKeySetting.value}`)
  }
}
