import { Uuid } from '@standardnotes/common'

export type GetSettingsDto = {
  userUuid: Uuid,
  settingName?: string
  allowMFARetrieval?: boolean
  updatedAfter?: number
}
