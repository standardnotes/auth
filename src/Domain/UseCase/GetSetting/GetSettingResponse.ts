import { Uuid } from '@standardnotes/common'

import { SimpleSetting } from '../../Setting/SimpleSetting'

export type GetSettingResponse = {
  success: true,
  userUuid: Uuid,
  setting: SimpleSetting,
} | {
  success: false,
  error: {
    message: string,
  },
}
