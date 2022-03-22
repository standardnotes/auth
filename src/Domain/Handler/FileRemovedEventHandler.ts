import {
  DomainEventHandlerInterface,
  FileRemovedEvent,
} from '@standardnotes/domain-events'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'


@injectable()
export class FileRemovedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: FileRemovedEvent): Promise<void> {
    const user = await this.userRepository.findOneByUuid(event.payload.userUuid)
    if (user === undefined) {
      this.logger.warn(`Could not find user with uuid: ${event.payload.userUuid}`)

      return
    }

    const bytesUsedSetting = await this.settingService.findSettingWithDecryptedValue({
      userUuid: event.payload.userUuid,
      settingName: SettingName.FileUploadBytesUsed,
    })
    if (bytesUsedSetting === undefined) {
      this.logger.warn(`Could not find bytes used setting for user with uuid: ${event.payload.userUuid}`)

      return
    }

    const bytesUsed = bytesUsedSetting.value as string

    await this.settingService.createOrReplace({
      user,
      props: {
        name: SettingName.FileUploadBytesUsed,
        unencryptedValue: (+(bytesUsed) - event.payload.fileByteSize).toString(),
        sensitive: false,
      },
    })
  }
}
