import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
import { FindSettingDTO } from './FindSettingDTO'
import { Setting } from './Setting'

export interface SettingServiceInterface {
  createOrReplace(dto: CreateOrReplaceSettingDto): Promise<CreateOrReplaceSettingResponse>
  findSetting(dto: FindSettingDTO): Promise<Setting | undefined>
}
