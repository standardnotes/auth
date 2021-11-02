import { OfflineUserSubscription } from '../../Subscription/OfflineUserSubscription'

export type AuthenticateOfflineSubscriptionTokenResponse = {
  success: true,
  email: string,
  subscriptions: Array<OfflineUserSubscription>
  featuresToken: string,
} | {
  success: false,
}
