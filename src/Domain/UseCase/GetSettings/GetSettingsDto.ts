import { Uuid } from '@standardnotes/auth'

export type GetSettingsDto = {
  userUuid: Uuid,
  settingName?: string
  allowMFARetrieval?: boolean
  updatedAfter?: number
}
