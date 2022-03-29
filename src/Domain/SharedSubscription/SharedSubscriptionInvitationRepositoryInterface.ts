import { Uuid } from '@standardnotes/common'
import { InvitationStatus } from './InvitationStatus'
import { SharedSubscriptionInvitation } from './SharedSubscriptionInvitation'

export interface SharedSubscriptionInvitationRepositoryInterface {
  save(sharedSubscriptionInvitation: SharedSubscriptionInvitation): Promise<SharedSubscriptionInvitation>
  findOneByUuidAndStatus(uuid: Uuid, status: InvitationStatus): Promise<SharedSubscriptionInvitation | undefined>
  findOneByUuid(uuid: Uuid): Promise<SharedSubscriptionInvitation | undefined>
}
