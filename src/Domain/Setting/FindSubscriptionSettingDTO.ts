import { Uuid } from '@standardnotes/common'
import { SettingName } from '@standardnotes/settings'

export type FindSubscriptionSettingDTO = {
  userUuid: Uuid,
  userSubscriptionUuid: Uuid,
  settingName: SettingName,
  settingUuid?: Uuid
}
