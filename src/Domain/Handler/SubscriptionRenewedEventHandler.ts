import {
  DomainEventHandlerInterface,
  SubscriptionPurchasedEvent,
  SubscriptionRenewedEvent,
} from '@standardnotes/domain-events'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { Setting } from '../Setting/Setting'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'

@injectable()
export class SubscriptionRenewedEventHandler
implements DomainEventHandlerInterface
{
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  async handle(
    event: SubscriptionPurchasedEvent | SubscriptionRenewedEvent
  ): Promise<void> {
    const user = await this.userRepository.findOneByEmail(
      event.payload.userEmail
    )

    if (user === undefined) {
      this.logger.warn(
        `Could not find user with email: ${event.payload.userEmail}`
      )
      return
    }

    await this.updateSubscriptionEndsAt(
      event.payload.subscriptionName,
      user.uuid,
      event.payload.subscriptionExpiresAt,
      event.payload.timestamp,
    )

    await this.updateUserExtensionKeySetting(user, event.payload.extensionKey)
  }

  private async updateSubscriptionEndsAt(
    subscriptionName: string,
    userUuid: string,
    subscriptionExpiresAt: number,
    timestamp: number,
  ): Promise<void> {
    await this.userSubscriptionRepository.updateEndsAtByNameAndUserUuid(
      subscriptionName,
      userUuid,
      subscriptionExpiresAt,
      timestamp,
    )
  }

  private async updateUserExtensionKeySetting(user: User, extensionKey: string) {
    await this.settingService.createOrReplace({
      user,
      props: {
        name: SettingName.ExtensionKey,
        value: extensionKey,
        serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
      },
    })
  }
}
