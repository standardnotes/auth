import { UserSubscription } from '../../Subscription/UserSubscription'

export type GetUserSubscriptionResponse = {
  success: true,
  userUuid: string,
  subscription?: UserSubscription,
} | {
  success: false,
  error: {
    message: string
  }
}
