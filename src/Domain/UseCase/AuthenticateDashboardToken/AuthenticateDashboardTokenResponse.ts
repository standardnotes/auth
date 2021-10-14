import { OfflineUserSubscription } from '../../Subscription/OfflineUserSubscription'

export type AuthenticateDashboardTokenResponse = {
  success: true,
  email: string,
  subscriptions: Array<OfflineUserSubscription>
} | {
  success: false,
}
