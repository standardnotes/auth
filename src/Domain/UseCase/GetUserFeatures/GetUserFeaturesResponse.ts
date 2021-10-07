import { FeatureDescriptionProjection } from '../../Feature/FeatureDescriptionProjection'

export type GetUserFeaturesResponse = {
  success: true,
  userUuid: string,
  features: FeatureDescriptionProjection[]
} | {
  success: false,
  error: {
    message: string
  }
}
