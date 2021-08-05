import { UseCaseInterface } from '../UseCaseInterface'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { GetUserFeaturesDto } from './GetUserFeaturesDto'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserFeaturesResponse } from './GetUserFeaturesResponse'
import { RoleName } from '@standardnotes/auth'
import { UserSubscription } from '../../User/UserSubscription'
import { Feature, Features } from '@standardnotes/features'
import { getSubscriptionNameForRoleName } from '../../Role/RoleToSubscriptionMap'

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

    const userFeatures: Feature[] = []
    await Promise.all(userRoles.map(async (role) => {
      const subscriptionName = getSubscriptionNameForRoleName(role.name as RoleName)
      const expiresAt = (userSubscriptions.find(subscription => subscription.planName === subscriptionName) as UserSubscription).endsAt

      const rolePermissions = await role.permissions

      rolePermissions.forEach(rolePermission => {
        const featureForPermission = Features.find(feature => feature.identifier === rolePermission.name) as Feature
        const alreadyAddedFeature = userFeatures.find(feature => feature.identifier === rolePermission.name)

        /* istanbul ignore else */
        if (!alreadyAddedFeature) {
          userFeatures.push({
            ...featureForPermission,
            expiresAt,
          })
        } else if (expiresAt > (alreadyAddedFeature.expiresAt as number)) {
          alreadyAddedFeature.expiresAt = expiresAt
        }
      })
    }))

    return {
      success: true,
      userUuid,
      features: userFeatures,
    }
  }
}
