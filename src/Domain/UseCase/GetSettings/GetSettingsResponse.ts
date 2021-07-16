import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '@standardnotes/auth'

export type GetSettingsResponse = {
  success: true,
  userUuid: Uuid,
  settings: SimpleSetting[],
} | {
  success: false,
  error: {
    message: string,
  },
}
