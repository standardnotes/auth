import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '../../Uuid/Uuid'

export type GetSettingResponse = {
  success: false,
  error: string,
} | {
  success: true,
  userUuid: Uuid,
  setting: SimpleSetting,
}
