import { SimpleSetting } from '../../Setting/SimpleSetting'
import { Uuid } from '../../Uuid/Uuid'

export type GetSettingsResponse = {
  userUuid: Uuid,
  settings: SimpleSetting[],
}
