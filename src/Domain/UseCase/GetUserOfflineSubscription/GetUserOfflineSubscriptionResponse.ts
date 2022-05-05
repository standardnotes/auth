import { OfflineUserSubscription } from '../../Subscription/OfflineUserSubscription'

export type GetUserOfflineSubscriptionResponse =
  | {
      success: true
      subscription?: OfflineUserSubscription
    }
  | {
      success: false
      error: {
        message: string
      }
    }
