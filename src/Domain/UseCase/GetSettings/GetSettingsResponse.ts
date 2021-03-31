import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '../../Uuid/Uuid'

export type GetSettingsResponse = {
  success: true,
  userUuid: Uuid,
  settings: SimpleSetting[],
}
