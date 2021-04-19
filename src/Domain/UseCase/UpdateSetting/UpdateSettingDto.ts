import { SettingProps } from '../../Setting/SettingProps'
import { Uuid } from '@standardnotes/auth'

export type UpdateSettingDto = {
  userUuid: Uuid,
  props: SettingProps,
}
