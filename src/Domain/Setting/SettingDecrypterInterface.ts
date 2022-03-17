import { Uuid } from '@standardnotes/common'
import { Setting } from './Setting'

export interface SettingDecrypterInterface {
  decryptSettingValue(setting: Setting, userUuid: Uuid): Promise<string | null>
}
