import { Setting } from '../../Setting/Setting'
import { Uuid } from '../../Uuid/Uuid'

export type GetSettingsResponse = {
  userUuid: Uuid,
  settings: Setting[],
}
