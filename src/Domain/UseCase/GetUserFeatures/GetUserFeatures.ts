import { UseCaseInterface } from '../UseCaseInterface'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { GetUserFeaturesDto } from './GetUserFeaturesDto'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserFeaturesResponse } from './GetUserFeaturesResponse'
import { FeatureServiceInterface } from '../../Feature/FeatureServiceInterface'

@injectable()
export class GetUserFeatures implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.FeatureService) private featureService: FeatureServiceInterface,
  ) {
  }

  async execute(dto: GetUserFeaturesDto): Promise<GetUserFeaturesResponse> {
    if (dto.offline) {
      const userFeatures = await this.featureService.getFeaturesForOfflineUser(dto.email, dto.offlineFeaturesToken)

      return {
        success: true,
        features: userFeatures,
      }
    }

    const user = await this.userRepository.findOneByUuid(dto.userUuid)

    if (user === undefined) {
      return {
        success: false,
        error: {
          message: `User ${dto.userUuid} not found.`,
        },
      }
    }

    const userFeatures = await this.featureService.getFeaturesForUser(user)

    return {
      success: true,
      userUuid: dto.userUuid,
      features: userFeatures,
    }
  }
}
