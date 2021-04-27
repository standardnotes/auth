import { Uuid } from '@standardnotes/auth'

export type DeleteSettingDto = { 
  settingName: string,
  userUuid: Uuid,
}
