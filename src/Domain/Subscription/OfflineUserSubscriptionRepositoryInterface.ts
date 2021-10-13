import { OfflineUserSubscription } from './OfflineUserSubscription'

export interface OfflineUserSubscriptionRepositoryInterface {
  findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined>
  updateEndsAtByNameAndEmail(name: string, email: string, endsAt: number, updatedAt: number): Promise<void>
  updateCancelled(name: string, email: string, cancelled: boolean, updatedAt: number): Promise<void>
  save(offlineUserSubscription: OfflineUserSubscription): Promise<OfflineUserSubscription>
}
