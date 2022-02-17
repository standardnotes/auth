import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { PermissionName } from '@standardnotes/features'
import * as bcrypt from 'bcryptjs'

import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'
import { SessionServiceInterface } from '../Session/SessionServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { SignInDTO } from './SignInDTO'
import { SignInResponse } from './SignInResponse'
import { UseCaseInterface } from './UseCaseInterface'

@injectable()
export class SignIn implements UseCaseInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.AuthResponseFactoryResolver) private authResponseFactoryResolver: AuthResponseFactoryResolverInterface,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.SessionService) private sessionService: SessionServiceInterface,
    @inject(TYPES.RoleService) private roleService: RoleServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ){
  }

  async execute(dto: SignInDTO): Promise<SignInResponse> {
    const user = await this.userRepository.findOneByEmail(dto.email)

    if (!user) {
      this.logger.debug(`User with email ${dto.email} was not found`)

      return {
        success: false,
        errorMessage: 'Invalid email or password',
      }
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.encryptedPassword)
    if (!passwordMatches) {
      this.logger.debug('Password does not match')

      return {
        success: false,
        errorMessage: 'Invalid email or password',
      }
    }

    const authResponseFactory = this.authResponseFactoryResolver.resolveAuthResponseFactoryVersion(dto.apiVersion)

    try {
      await this.domainEventPublisher.publish(
        this.domainEventFactory.createUserSignedInEvent({
          userUuid: user.uuid,
          userEmail: user.email,
          device: this.sessionService.getOperatingSystemInfoFromUserAgent(dto.userAgent),
          browser: this.sessionService.getBrowserInfoFromUserAgent(dto.userAgent),
          signInAlertEnabled: await this.roleService.userHasPermission(user.uuid, PermissionName.SignInAlerts),
        })
      )
    } catch (error) {
      this.logger.error(`Could not publish sign in event: ${error.message}`)
    }

    return {
      success: true,
      authResponse: await authResponseFactory.createResponse(
        user,
        dto.apiVersion,
        dto.userAgent,
        dto.ephemeralSession
      ),
    }
  }
}
