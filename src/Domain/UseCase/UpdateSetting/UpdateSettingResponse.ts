import { Setting } from '../../Setting/Setting'

export type UpdateSettingResponse = {
  success: true,
  setting: Setting,
  statusCode: number,
} | {
  success: false,
  error: {
    message: string,
  },
}
