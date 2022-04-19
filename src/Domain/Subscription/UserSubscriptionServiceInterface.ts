import { Uuid } from '@standardnotes/common'
import { UserSubscription } from './UserSubscription'

export interface UserSubscriptionServiceInterface {
  findRegularSubscriptionForUuid(uuid: Uuid): Promise<UserSubscription | undefined>
  findRegularSubscriptionForUserUuid(userUuid: Uuid): Promise<UserSubscription | undefined>
}
