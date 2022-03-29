import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'

import TYPES from '../Bootstrap/Types'
import { AcceptSharedSubscriptionInvitation } from '../Domain/UseCase/AcceptSharedSubscriptionInvitation/AcceptSharedSubscriptionInvitation'
import { DeclineSharedSubscriptionInvitation } from '../Domain/UseCase/DeclineSharedSubscriptionInvitation/DeclineSharedSubscriptionInvitation'
import { InviteToSharedSubscription } from '../Domain/UseCase/InviteToSharedSubscription/InviteToSharedSubscription'

@controller('/subscription-invites')
export class SubscriptionInvitesController extends BaseHttpController {
  constructor(
    @inject(TYPES.InviteToSharedSubscription) private inviteToSharedSubscription: InviteToSharedSubscription,
    @inject(TYPES.AcceptSharedSubscriptionInvitation) private acceptSharedSubscriptionInvitation: AcceptSharedSubscriptionInvitation,
    @inject(TYPES.DeclineSharedSubscriptionInvitation) private declineSharedSubscriptionInvitation: DeclineSharedSubscriptionInvitation
  ) {
    super()
  }

  @httpPost('/:inviteUuid/accept')
  async acceptInvite(request: Request): Promise<results.JsonResult> {
    const result = await this.acceptSharedSubscriptionInvitation.execute({
      sharedSubscriptionInvitationUuid: request.params.inviteUuid,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpPost('/:inviteUuid/decline')
  async declineInvite(request: Request): Promise<results.JsonResult> {
    const result = await this.declineSharedSubscriptionInvitation.execute({
      sharedSubscriptionInvitationUuid: request.params.inviteUuid,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }

  @httpPost('/', TYPES.AuthMiddleware)
  async inviteToSubscriptionSharing(request: Request, response: Response): Promise<results.JsonResult> {
    if (!request.body.identifier) {
      return this.json({ error: { message: 'Missing invitee identifier' } }, 400)
    }
    const result = await this.inviteToSharedSubscription.execute({
      inviterEmail: response.locals.user.email,
      inviterUuid: response.locals.user.uuid,
      inviteeIdentifier: request.body.identifier,
    })

    if (result.success) {
      return this.json(result)
    }

    return this.json(result, 400)
  }
}
