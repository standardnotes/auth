import { Uuid } from '@standardnotes/common'

export type InviteToSharedSubscriptionDTO = {
  inviterEmail: string
  inviterUuid: Uuid
  inviteeIdentifier: string
}
