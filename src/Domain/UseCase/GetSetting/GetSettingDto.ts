import { Uuid } from '../../Uuid/Uuid'

export type GetSettingDto = {
  userUuid: Uuid,
  settingName: string,
}
