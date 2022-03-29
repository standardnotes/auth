import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'

import { MySQLSharedSubscriptionInvitationRepository } from './MySQLSharedSubscriptionInvitationRepository'
import { SharedSubscriptionInvitation } from '../../Domain/SharedSubscription/SharedSubscriptionInvitation'
import { InvitationStatus } from '../../Domain/SharedSubscription/InvitationStatus'

describe('MySQLSharedSubscriptionInvitationRepository', () => {
  let repository: MySQLSharedSubscriptionInvitationRepository
  let queryBuilder: SelectQueryBuilder<SharedSubscriptionInvitation>
  let invitation: SharedSubscriptionInvitation

  const makeSubject = () => {
    return new MySQLSharedSubscriptionInvitationRepository()
  }

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<SharedSubscriptionInvitation>>

    invitation = {} as jest.Mocked<SharedSubscriptionInvitation>

    repository = makeSubject()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one setting by name and user uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(invitation)

    const result = await repository.findOneByUuidAndStatus('1-2-3', InvitationStatus.Sent)

    expect(queryBuilder.where).toHaveBeenCalledWith('invitation.uuid = :uuid AND invitation.status = :status', { uuid: '1-2-3', status: 'sent' })

    expect(result).toEqual(invitation)
  })
})
