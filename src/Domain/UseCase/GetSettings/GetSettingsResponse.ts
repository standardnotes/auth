import { Setting } from '../../Setting/Setting'

export type GetSettingsResponse = {
  // todo: uuid
  userUuid: string,
  settings: Setting[],
}
