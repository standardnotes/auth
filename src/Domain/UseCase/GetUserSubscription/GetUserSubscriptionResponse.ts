import { UserSubscription } from '../../User/UserSubscription'

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
