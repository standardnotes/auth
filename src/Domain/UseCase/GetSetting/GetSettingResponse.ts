import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '@standardnotes/auth'

export type GetSettingResponse = {
  success: false,
  error: string,
} | {
  success: true,
  userUuid: Uuid,
  setting: SimpleSetting,
}
