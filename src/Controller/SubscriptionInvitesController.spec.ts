import 'reflect-metadata'

import * as express from 'express'

import { SubscriptionInvitesController } from './SubscriptionInvitesController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { InviteToSharedSubscription } from '../Domain/UseCase/InviteToSharedSubscription/InviteToSharedSubscription'
import { AcceptSharedSubscriptionInvitation } from '../Domain/UseCase/AcceptSharedSubscriptionInvitation/AcceptSharedSubscriptionInvitation'

describe('SubscriptionInvitesController', () => {
  let inviteToSharedSubscription: InviteToSharedSubscription
  let acceptSharedSubscriptionInvitation: AcceptSharedSubscriptionInvitation

  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new SubscriptionInvitesController(
    inviteToSharedSubscription,
    acceptSharedSubscriptionInvitation,
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    user.uuid = '123'
    user.email = 'test@test.te'

    inviteToSharedSubscription = {} as jest.Mocked<InviteToSharedSubscription>
    inviteToSharedSubscription.execute = jest.fn()

    acceptSharedSubscriptionInvitation = {} as jest.Mocked<AcceptSharedSubscriptionInvitation>
    acceptSharedSubscriptionInvitation.execute = jest.fn()

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>

    response = {
      locals: {},
    } as jest.Mocked<express.Response>
  })

  it('should accept invitation to subscription sharing', async () => {
    request.params.inviteUuid = '1-2-3'

    acceptSharedSubscriptionInvitation.execute = jest.fn().mockReturnValue({
      success: true,
    })

    const httpResponse = <results.JsonResult> await createController().acceptInvite(request)
    const result = await httpResponse.executeAsync()

    expect(acceptSharedSubscriptionInvitation.execute).toHaveBeenCalledWith({
      sharedSubscriptionInvitationUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not accept invitation to subscription sharing if the workflow fails', async () => {
    request.params.inviteUuid = '1-2-3'

    acceptSharedSubscriptionInvitation.execute = jest.fn().mockReturnValue({
      success: false,
    })

    const httpResponse = <results.JsonResult> await createController().acceptInvite(request)
    const result = await httpResponse.executeAsync()

    expect(acceptSharedSubscriptionInvitation.execute).toHaveBeenCalledWith({
      sharedSubscriptionInvitationUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(400)
  })

  it('should invite to user subscription', async () => {
    request.body.identifier = 'invitee@test.te'
    response.locals.user = {
      uuid: '1-2-3',
      email: 'test@test.te',
    }

    inviteToSharedSubscription.execute = jest.fn().mockReturnValue({
      success: true,
    })

    const httpResponse = <results.JsonResult> await createController().inviteToSubscriptionSharing(request, response)
    const result = await httpResponse.executeAsync()

    expect(inviteToSharedSubscription.execute).toHaveBeenCalledWith({
      inviterEmail: 'test@test.te',
      inviterUuid: '1-2-3',
      inviteeIdentifier: 'invitee@test.te',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not invite to user subscription if the identifier is missing in request', async () => {
    response.locals.user = {
      uuid: '1-2-3',
      email: 'test@test.te',
    }

    const httpResponse = <results.JsonResult> await createController().inviteToSubscriptionSharing(request, response)
    const result = await httpResponse.executeAsync()

    expect(inviteToSharedSubscription.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(400)
  })

  it('should not invite to user subscription if the workflow does not run', async () => {
    request.body.identifier = 'invitee@test.te'
    response.locals.user = {
      uuid: '1-2-3',
      email: 'test@test.te',
    }

    inviteToSharedSubscription.execute = jest.fn().mockReturnValue({
      success: false,
    })

    const httpResponse = <results.JsonResult> await createController().inviteToSubscriptionSharing(request, response)
    const result = await httpResponse.executeAsync()

    expect(result.statusCode).toEqual(400)
  })
})