import { UseCaseInterface } from '../UseCaseInterface'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { GetUserFeaturesDto } from './GetUserFeaturesDto'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserFeaturesResponse } from './GetUserFeaturesResponse'
import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { Feature } from '@standardnotes/features'
import { UserSubscription } from '../../User/UserSubscription'
import { Features } from '@standardnotes/features'


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

    const features = await Promise.all(userRoles.map(async (role) => {
      const subscriptionName = this.roleNameToSubscriptionNameMap.get(role.name as RoleName)
      const expiresAt = (userSubscriptions.find(subscription => subscription.planName === subscriptionName) as UserSubscription).endsAt

      const permissions = await role.permissions
      const featuresWithExpirationDate = permissions.map(permission => {
        const featureItem = Features.find(feature => feature.identifier === permission.name)

        return {
          ...featureItem,
          expiresAt,
        }
      })

      return featuresWithExpirationDate
    }))

    return {
      success: true,
      userUuid,
      features: features.flat() as Feature[],
    }
  }

  private roleNameToSubscriptionNameMap = new Map<RoleName, SubscriptionName>([
    [RoleName.CoreUser, SubscriptionName.CorePlan],
    [RoleName.PlusUser, SubscriptionName.PlusPlan],
    [RoleName.ProUser, SubscriptionName.ProPlan],
  ]);
}
