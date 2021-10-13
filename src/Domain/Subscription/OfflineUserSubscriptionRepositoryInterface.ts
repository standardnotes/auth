import { OfflineUserSubscription } from './OfflineUserSubscription'

export interface OfflineUserSubscriptionRepositoryInterface {
  findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined>
  save(offlineUserSubscription: OfflineUserSubscription): Promise<OfflineUserSubscription>
}
