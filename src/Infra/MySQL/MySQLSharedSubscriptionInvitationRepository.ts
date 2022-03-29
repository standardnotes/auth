import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { InvitationStatus } from '../../Domain/SharedSubscription/InvitationStatus'
import { SharedSubscriptionInvitation } from '../../Domain/SharedSubscription/SharedSubscriptionInvitation'
import { SharedSubscriptionInvitationRepositoryInterface } from '../../Domain/SharedSubscription/SharedSubscriptionInvitationRepositoryInterface'

@injectable()
@EntityRepository(SharedSubscriptionInvitation)
export class MySQLSharedSubscriptionInvitationRepository extends Repository<SharedSubscriptionInvitation> implements SharedSubscriptionInvitationRepositoryInterface {
  async findOneByUuidAndStatus(uuid: string, status: InvitationStatus): Promise<SharedSubscriptionInvitation | undefined> {
    return this.createQueryBuilder('invitation')
      .where(
        'invitation.uuid = :uuid AND invitation.status = :status',
        {
          uuid,
          status,
        }
      )
      .getOne()
  }
}