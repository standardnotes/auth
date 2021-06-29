import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '@standardnotes/auth'

export type GetMFASettingResponse = {
  success: true,
  userUuid: Uuid,
  setting: SimpleSetting,
} | {
  success: false,
  error: {
    message: string,
  },
}
