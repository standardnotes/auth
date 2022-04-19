import {
  DomainEventHandlerInterface,
  FileUploadedEvent,
} from '@standardnotes/domain-events'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { SubscriptionSettingServiceInterface } from '../Setting/SubscriptionSettingServiceInterface'
import { UserSubscriptionServiceInterface } from '../Subscription/UserSubscriptionServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'


@injectable()
export class FileUploadedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionService) private userSubscriptionService: UserSubscriptionServiceInterface,
    @inject(TYPES.SubscriptionSettingService) private subscriptionSettingService: SubscriptionSettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: FileUploadedEvent): Promise<void> {
    const user = await this.userRepository.findOneByUuid(event.payload.userUuid)
    if (user === undefined) {
      this.logger.warn(`Could not find user with uuid: ${event.payload.userUuid}`)

      return
    }

    const userSubscription = await this.userSubscriptionService.findRegularSubscriptionForUserUuid(event.payload.userUuid)
    if (userSubscription === undefined) {
      this.logger.warn(`Could not find user subscription for user with uuid: ${event.payload.userUuid}`)

      return
    }

    let bytesUsed = '0'
    const bytesUsedSetting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: (await userSubscription.user).uuid,
      userSubscriptionUuid: userSubscription.uuid,
      settingName: SettingName.FileUploadBytesUsed,
    })
    if (bytesUsedSetting !== undefined) {
      bytesUsed = bytesUsedSetting.value as string
    }

    await this.subscriptionSettingService.createOrReplace({
      userSubscription,
      props: {
        name: SettingName.FileUploadBytesUsed,
        unencryptedValue: (+(bytesUsed) + event.payload.fileByteSize).toString(),
        sensitive: false,
      },
    })
  }
}
