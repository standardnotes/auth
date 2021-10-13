import { Uuid } from '@standardnotes/common'

export type GetUserFeaturesDto = {
  userUuid: Uuid,
  offline: false
} | {
  email: string,
  offlineFeaturesToken: string,
  offline: true
}
