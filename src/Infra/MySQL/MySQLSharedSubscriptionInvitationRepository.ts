/* istanbul ignore file */
import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { SharedSubscriptionInvitation } from '../../Domain/SharedSubscription/SharedSubscriptionInvitation'
import { SharedSubscriptionInvitationRepositoryInterface } from '../../Domain/SharedSubscription/SharedSubscriptionInvitationRepositoryInterface'

@injectable()
@EntityRepository(SharedSubscriptionInvitation)
export class MySQLSharedSubscriptionInvitationRepository extends Repository<SharedSubscriptionInvitation> implements SharedSubscriptionInvitationRepositoryInterface {
}
