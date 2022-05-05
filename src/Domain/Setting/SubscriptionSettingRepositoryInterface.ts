import { SubscriptionSetting } from './SubscriptionSetting'

export interface SubscriptionSettingRepositoryInterface {
  findOneByUuid(uuid: string): Promise<SubscriptionSetting | undefined>
  findLastByNameAndUserSubscriptionUuid(
    name: string,
    userSubscriptionUuid: string,
  ): Promise<SubscriptionSetting | undefined>
  save(subscriptionSetting: SubscriptionSetting): Promise<SubscriptionSetting>
}
