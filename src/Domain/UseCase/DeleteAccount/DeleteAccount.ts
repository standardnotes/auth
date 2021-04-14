import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { DeleteAccountDTO } from './DeleteAccountDTO'
import { DeleteAccountResponse } from './DeleteAccountResponse'

@injectable()
export class DeleteAccount implements UseCaseInterface {
  constructor (
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
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

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createAccountDeletionRequestedEvent(user.uuid)
    )

    return {
      success: true,
      message: 'Successfully deleted user',
      responseCode: 200,
    }
  }
}
