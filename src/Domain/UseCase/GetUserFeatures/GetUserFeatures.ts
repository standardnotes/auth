import { UseCaseInterface } from '../UseCaseInterface'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { GetUserFeaturesDto } from './GetUserFeaturesDto'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserFeaturesResponse } from './GetUserFeaturesResponse'
import { Permission, PermissionName, RoleName } from '@standardnotes/auth'
import { UserSubscription } from '../../User/UserSubscription'
import { Feature, Features } from '@standardnotes/features'
import { getSubscriptionNameForRoleName } from '../../Role/RoleToSubscriptionMap'

type PermissionWithExpiresAt = Permission & {
  expiresAt: number
}

@injectable()
export class GetUserFeatures implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ) {
  }

  async execute(dto: GetUserFeaturesDto): Promise<GetUserFeaturesResponse> {
    const { userUuid } = dto

    const user = await this.userRepository.findOneByUuid(userUuid)

    if (user === undefined) {
      return {
        success: false,
        error: {
          message: `User ${userUuid} not found.`,
        },
      }
    }

    const userRoles = await user.roles
    const userSubscriptions = await user.subscriptions
    const permissions: PermissionWithExpiresAt[] = []

    await Promise.all(userRoles.map(async (role) => {
      const subscriptionName = getSubscriptionNameForRoleName(role.name as RoleName)
      const expiresAt = (userSubscriptions.find(subscription => subscription.planName === subscriptionName) as UserSubscription).endsAt

      const rolePermissions = await role.permissions

      rolePermissions.forEach(rolePermission => {
        const permissionItem = permissions.find(permission => permission.name === rolePermission.name)
        /* istanbul ignore else */
        if (!permissionItem) {
          permissions.push({
            ...rolePermission,
            name: rolePermission.name as PermissionName,
            expiresAt,
          })
        } else if (expiresAt > permissionItem.expiresAt) {
          permissionItem.expiresAt = expiresAt
        }
      })
    }))

    const features: Feature[] = []
    permissions.forEach(permission => {
      const featureItem = Features.find(feature => feature.identifier === permission.name) as Feature
      features.push({
        ...featureItem,
        expiresAt: permission.expiresAt,
      })
    })

    return {
      success: true,
      userUuid,
      features,
    }
  }
}
