import { SharedSubscriptionInvitation } from './SharedSubscriptionInvitation'

export interface SharedSubscriptionInvitationRepositoryInterface {
  save(sharedSubscriptionInvitation: SharedSubscriptionInvitation): Promise<SharedSubscriptionInvitation>
}
