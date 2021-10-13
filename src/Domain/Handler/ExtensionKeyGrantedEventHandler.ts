import {
  DomainEventHandlerInterface,
  ExtensionKeyGrantedEvent,
} from '@standardnotes/domain-events'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { OfflineSettingServiceInterface } from '../Setting/OfflineSettingServiceInterface'
import { OfflineSettingName } from '../Setting/OfflineSettingName'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'

@injectable()
export class ExtensionKeyGrantedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.OfflineSettingService) private offlineSettingService: OfflineSettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: ExtensionKeyGrantedEvent): Promise<void> {
    if (event.payload.offline) {
      await this.offlineSettingService.createOrUpdate({
        email: event.payload.userEmail,
        name: OfflineSettingName.FeaturesToken,
        value: event.payload.offlineFeaturesToken,
      })

      return
    }

    const user = await this.userRepository.findOneByEmail(
      event.payload.userEmail
    )

    if (user === undefined) {
      this.logger.warn(
        `Could not find user with email: ${event.payload.userEmail}`
      )
      return
    }

    await this.settingService.createOrReplace({
      user,
      props: {
        name: SettingName.ExtensionKey,
        value: event.payload.extensionKey,
        serverEncryptionVersion: EncryptionVersion.Default,
        sensitive: true,
      },
    })
  }
}
