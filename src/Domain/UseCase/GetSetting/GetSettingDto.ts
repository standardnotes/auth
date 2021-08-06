import { Uuid } from '@standardnotes/common'

export type GetSettingDto = {
  userUuid: Uuid,
  settingName: string,
  allowMFARetrieval?: boolean
}
