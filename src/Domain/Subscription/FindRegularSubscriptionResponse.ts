import { UserSubscription } from './UserSubscription'

export type FindRegularSubscriptionResponse = {
  regularSubscription: UserSubscription | undefined
  sharedSubscription: UserSubscription | undefined
}
