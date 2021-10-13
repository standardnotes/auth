import { OfflineUserSubscription } from './OfflineUserSubscription'

export interface OfflineUserSubscriptionRepositoryInterface {
  findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined>
  updateCancelled(name: string, email: string, cancelled: boolean, updatedAt: number): Promise<void>
  save(offlineUserSubscription: OfflineUserSubscription): Promise<OfflineUserSubscription>
}
