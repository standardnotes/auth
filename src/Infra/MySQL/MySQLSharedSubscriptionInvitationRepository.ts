import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { InvitationStatus } from '../../Domain/SharedSubscription/InvitationStatus'
import { SharedSubscriptionInvitation } from '../../Domain/SharedSubscription/SharedSubscriptionInvitation'
import { SharedSubscriptionInvitationRepositoryInterface } from '../../Domain/SharedSubscription/SharedSubscriptionInvitationRepositoryInterface'

@injectable()
@EntityRepository(SharedSubscriptionInvitation)
export class MySQLSharedSubscriptionInvitationRepository
  extends Repository<SharedSubscriptionInvitation>
  implements SharedSubscriptionInvitationRepositoryInterface
{
  async findByInviterEmail(inviterEmail: string): Promise<SharedSubscriptionInvitation[]> {
    return this.createQueryBuilder('invitation')
      .where('invitation.inviter_identifier = :inviterEmail', {
        inviterEmail,
      })
      .getMany()
  }

  async countByInviterEmailAndStatus(inviterEmail: string, statuses: InvitationStatus[]): Promise<number> {
    return this.createQueryBuilder('invitation')
      .where('invitation.inviter_identifier = :inviterEmail AND invitation.status IN (:...statuses)', {
        inviterEmail,
        statuses,
      })
      .getCount()
  }

  async findOneByUuid(uuid: string): Promise<SharedSubscriptionInvitation | undefined> {
    return this.createQueryBuilder('invitation')
      .where('invitation.uuid = :uuid', {
        uuid,
      })
      .getOne()
  }

  async findOneByUuidAndStatus(
    uuid: string,
    status: InvitationStatus,
  ): Promise<SharedSubscriptionInvitation | undefined> {
    return this.createQueryBuilder('invitation')
      .where('invitation.uuid = :uuid AND invitation.status = :status', {
        uuid,
        status,
      })
      .getOne()
  }
}
