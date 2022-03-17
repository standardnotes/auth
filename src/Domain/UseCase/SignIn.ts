import * as bcrypt from 'bcryptjs'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { PermissionName } from '@standardnotes/features'
import { MuteSignInEmailsOption, SettingName } from '@standardnotes/settings'

import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { AuthResponseFactoryResolverInterface } from '../Auth/AuthResponseFactoryResolverInterface'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'
import { SessionServiceInterface } from '../Session/SessionServiceInterface'
import { Setting } from '../Setting/Setting'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { User } from '../User/User'
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
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
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
      const muteSignInEmailsSetting = await this.findOrCreateMuteSignInEmailsSetting(user)

      await this.domainEventPublisher.publish(
        this.domainEventFactory.createUserSignedInEvent({
          userUuid: user.uuid,
          userEmail: user.email,
          device: this.sessionService.getOperatingSystemInfoFromUserAgent(dto.userAgent),
          browser: this.sessionService.getBrowserInfoFromUserAgent(dto.userAgent),
          signInAlertEnabled: await this.roleService.userHasPermission(user.uuid, PermissionName.SignInAlerts) && muteSignInEmailsSetting.value === MuteSignInEmailsOption.NotMuted,
          muteSignInEmailsSettingUuid: muteSignInEmailsSetting.uuid,
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

  private async findOrCreateMuteSignInEmailsSetting(user: User): Promise<Setting> {
    const existingMuteSignInEmailsSetting = await this.settingService.findSettingWithDecryptedValue({
      userUuid: user.uuid,
      settingName: SettingName.MuteSignInEmails,
    })

    if (existingMuteSignInEmailsSetting !== undefined) {
      return existingMuteSignInEmailsSetting
    }

    const createSettingResult = await this.settingService.createOrReplace({
      user,
      props: {
        name: SettingName.MuteSignInEmails,
        sensitive: false,
        unencryptedValue: MuteSignInEmailsOption.NotMuted,
        serverEncryptionVersion: EncryptionVersion.Unencrypted,
      },
    })

    return createSettingResult.setting
  }
}
