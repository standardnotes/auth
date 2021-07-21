import { Uuid } from '@standardnotes/auth'

export type DeleteSettingDto = {
  userUuid: Uuid,
  settingName: string,
  uuid?: string,
  timestamp?: number,
  softDelete?: boolean,
}
