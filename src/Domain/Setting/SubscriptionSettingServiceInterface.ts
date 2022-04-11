import { SubscriptionName } from '@standardnotes/common'
import { UserSubscription } from '../Subscription/UserSubscription'

import { CreateOrReplaceSubscriptionSettingDTO } from './CreateOrReplaceSubscriptionSettingDTO'
import { CreateOrReplaceSubscriptionSettingResponse } from './CreateOrReplaceSubscriptionSettingResponse'
import { FindSubscriptionSettingDTO } from './FindSubscriptionSettingDTO'
import { SubscriptionSetting } from './SubscriptionSetting'

export interface SubscriptionSettingServiceInterface {
  applyDefaultSubscriptionSettingsForSubscription(userSubscription: UserSubscription, subscriptionName: SubscriptionName): Promise<void>
  createOrReplace(dto: CreateOrReplaceSubscriptionSettingDTO): Promise<CreateOrReplaceSubscriptionSettingResponse>
  findSubscriptionSettingWithDecryptedValue(dto: FindSubscriptionSettingDTO): Promise<SubscriptionSetting | undefined>
}
