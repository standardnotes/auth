import { SubscriptionName } from '@standardnotes/common'
import { User } from '../User/User'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
import { FindSettingDTO } from './FindSettingDTO'
import { Setting } from './Setting'

export interface SettingServiceInterface {
  applyDefaultSettingsForSubscription(user: User, subscriptionName: SubscriptionName): Promise<void>
  applyDefaultSettingsUponRegistration(user: User): Promise<void>
  createOrReplace(dto: CreateOrReplaceSettingDto): Promise<CreateOrReplaceSettingResponse>
  findSetting(dto: FindSettingDTO): Promise<Setting | undefined>
}
