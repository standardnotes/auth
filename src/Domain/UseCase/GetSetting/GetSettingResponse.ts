import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '@standardnotes/auth'

export type GetSettingResponse = {
  success: true,
  userUuid: Uuid,
  setting: SimpleSetting,
} | {
  success: false,
  error: {
    message: string,
  },
}
