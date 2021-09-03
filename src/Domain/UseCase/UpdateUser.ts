import { DomainEventPublisherInterface, UserEmailChangedEvent } from '@standardnotes/domain-events'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UpdateUserDTO } from './UpdateUserDTO'
import { UpdateUserResponse } from './UpdateUserResponse'
import { UseCaseInterface } from './UseCaseInterface'

@injectable()
export class UpdateUser implements UseCaseInterface {
  constructor (
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.AuthResponseFactoryResolver) private authResponseFactoryResolver: AuthResponseFactoryResolverInterface,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
  ) {
  }

  async execute(dto: UpdateUserDTO): Promise<UpdateUserResponse> {
    const { user, apiVersion, ...updateFields } = dto

    Object.keys(updateFields).forEach(
      key =>
        (updateFields[key] === undefined || updateFields[key] === null)
        && delete updateFields[key]
    )

    let UserEmailChangedEvent: UserEmailChangedEvent | undefined = undefined
    if ('email' in updateFields) {
      const existingUser = await this.userRepository.findOneByEmail(updateFields.email as string)
      if (existingUser !== undefined) {
        return {
          success: false,
        }
      }

      UserEmailChangedEvent = this.domainEventFactory.createUserEmailChangedEvent(user.uuid, user.email, updateFields.email as string)
    }

    Object.assign(user, updateFields)

    await this.userRepository.save(user)

    if (UserEmailChangedEvent) {
      await this.domainEventPublisher.publish(UserEmailChangedEvent)
    }

    const authResponseFactory = this.authResponseFactoryResolver.resolveAuthResponseFactoryVersion(apiVersion)

    return {
      success: true,
      authResponse: await authResponseFactory.createResponse(user, apiVersion, dto.updatedWithUserAgent),
    }
  }
}
