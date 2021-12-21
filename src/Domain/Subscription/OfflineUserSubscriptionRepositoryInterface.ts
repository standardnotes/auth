import { OfflineUserSubscription } from './OfflineUserSubscription'

export interface OfflineUserSubscriptionRepositoryInterface {
  findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined>
  findOneBySubscriptionId(subscriptionId: number): Promise<OfflineUserSubscription | undefined>
  findByEmail(email: string, activeAfter: number): Promise<OfflineUserSubscription[]>
  updateEndsAt(subscriptionId: number, endsAt: number, updatedAt: number): Promise<void>
  updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void>
  save(offlineUserSubscription: OfflineUserSubscription): Promise<OfflineUserSubscription>
}
