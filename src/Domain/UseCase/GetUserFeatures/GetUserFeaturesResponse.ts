import { FeatureDescription } from '@standardnotes/features'

export type GetUserFeaturesResponse = {
  success: true,
  userUuid: string,
  features: FeatureDescription[]
} | {
  success: false,
  error: {
    message: string
  }
}
