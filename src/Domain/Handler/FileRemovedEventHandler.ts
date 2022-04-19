import {
  DomainEventHandlerInterface,
  FileRemovedEvent,
} from '@standardnotes/domain-events'
import { SubscriptionSettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { SubscriptionSettingServiceInterface } from '../Setting/SubscriptionSettingServiceInterface'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'


@injectable()
export class FileRemovedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.SubscriptionSettingService) private subscriptionSettingService: SubscriptionSettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: FileRemovedEvent): Promise<void> {
    const userSubscription = await this.userSubscriptionRepository.findOneByUuid(event.payload.regularSubscriptionUuid)
    if (userSubscription === undefined) {
      this.logger.warn(`Could not find user subscription for with uuid: ${event.payload.regularSubscriptionUuid}`)

      return
    }

    const bytesUsedSetting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: (await userSubscription.user).uuid,
      userSubscriptionUuid: userSubscription.uuid,
      subscriptionSettingName: SubscriptionSettingName.FileUploadBytesUsed,
    })
    if (bytesUsedSetting === undefined) {
      this.logger.warn(`Could not find bytes used setting for user with uuid: ${event.payload.userUuid}`)

      return
    }

    const bytesUsed = bytesUsedSetting.value as string

    await this.subscriptionSettingService.createOrReplace({
      userSubscription,
      props: {
        name: SubscriptionSettingName.FileUploadBytesUsed,
        unencryptedValue: (+(bytesUsed) - event.payload.fileByteSize).toString(),
        sensitive: false,
      },
    })
  }
}
