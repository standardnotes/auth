import { Uuid } from '@standardnotes/auth'

export type DeleteSettingDto = {
  userUuid: Uuid,
  settingName: string,
  softDelete?: boolean,
}
