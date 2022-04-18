import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { UserSubscriptionType } from '../../Subscription/UserSubscriptionType'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { DeleteAccountDTO } from './DeleteAccountDTO'
import { DeleteAccountResponse } from './DeleteAccountResponse'

@injectable()
export class DeleteAccount implements UseCaseInterface {
  constructor (
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
  ) {
  }

  async execute(dto: DeleteAccountDTO): Promise<DeleteAccountResponse> {
    const user = await this.userRepository.findOneByEmail(dto.email)

    if (user === undefined) {
      return {
        success: false,
        responseCode: 404,
        message: 'User not found',
      }
    }

    let regularSubscriptionUuid = undefined
    const userSubscription = await this.userSubscriptionRepository.findOneByUserUuid(user.uuid)
    if (userSubscription !== undefined) {
      regularSubscriptionUuid = userSubscription.uuid
      if (userSubscription.subscriptionType === UserSubscriptionType.Shared) {
        regularSubscriptionUuid = undefined
        const regularSubscriptions = await this.userSubscriptionRepository.findBySubscriptionIdAndType(
          userSubscription.subscriptionId as number,
          UserSubscriptionType.Regular
        )
        if (regularSubscriptions.length > 0) {
          regularSubscriptionUuid = regularSubscriptions[0].uuid
        }
      }
    }

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createAccountDeletionRequestedEvent({
        userUuid: user.uuid,
        regularSubscriptionUuid,
      })
    )

    return {
      success: true,
      message: 'Successfully deleted user',
      responseCode: 200,
    }
  }
}
