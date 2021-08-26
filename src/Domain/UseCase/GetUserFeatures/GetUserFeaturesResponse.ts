import { Feature } from '@standardnotes/features'

export type GetUserFeaturesResponse = {
  success: true,
  userUuid: string,
  features: Feature[]
} | {
  success: false,
  error: {
    message: string
  }
}
