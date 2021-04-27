import { Uuid } from '@standardnotes/auth'

export type DeleteSettingResponse = {
  success: false,
  error: string,
} | {
  success: true,
  userUuid: Uuid,
  settingName: string,
}
