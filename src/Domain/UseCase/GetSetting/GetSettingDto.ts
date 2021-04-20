import { Uuid } from '@standardnotes/auth'

export type GetSettingDto = {
  userUuid: Uuid,
  settingName: string,
}
