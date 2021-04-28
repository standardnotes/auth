import { Uuid } from '@standardnotes/auth'

export type DeleteSettingResponse = {
  success: true,
  userUuid: Uuid,
  settingName: string,
} | {
  success: false,
  error: {
    message: string,
  },
}
