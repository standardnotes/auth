import {
  DomainEventHandlerInterface,
  ExtensionKeyGrantedEvent,
} from '@standardnotes/domain-events'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'

@injectable()
export class ExtensionKeyGrantedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: ExtensionKeyGrantedEvent): Promise<void> {
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
