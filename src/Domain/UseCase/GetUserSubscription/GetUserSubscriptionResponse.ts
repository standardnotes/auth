import { UserSubscription } from '../../Subscription/UserSubscription'

export type GetUserSubscriptionResponse = {
  success: true,
  user: {uuid: string, email: string},
  subscription?: UserSubscription,
} | {
  success: false,
  error: {
    message: string
  }
}
