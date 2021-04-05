import { SettingProps } from '../../Setting/SettingProps'
import { Uuid } from '../../Uuid/Uuid'

export type UpdateSettingDto = {
  userUuid: Uuid,
  props: SettingProps,
}
