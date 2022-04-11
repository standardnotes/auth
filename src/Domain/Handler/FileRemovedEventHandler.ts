import {
  DomainEventHandlerInterface,
  FileRemovedEvent,
} from '@standardnotes/domain-events'
import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { SubscriptionSettingServiceInterface } from '../Setting/SubscriptionSettingServiceInterface'
import { UserSubscriptionRepositoryInterface } from '../Subscription/UserSubscriptionRepositoryInterface'
import { UserSubscriptionType } from '../Subscription/UserSubscriptionType'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'


@injectable()
export class FileRemovedEventHandler implements DomainEventHandlerInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.SubscriptionSettingService) private subscriptionSettingService: SubscriptionSettingServiceInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: FileRemovedEvent): Promise<void> {
    const user = await this.userRepository.findOneByUuid(event.payload.userUuid)
    if (user === undefined) {
      this.logger.warn(`Could not find user with uuid: ${event.payload.userUuid}`)

      return
    }

    let userSubscription = await this.userSubscriptionRepository.findOneByUserUuid(event.payload.userUuid)
    if (userSubscription === undefined) {
      this.logger.warn(`Could not find user subscription for user with uuid: ${event.payload.userUuid}`)

      return
    }

    if (userSubscription.subscriptionType === UserSubscriptionType.Shared) {
      const regularUserSubscriptions = await this.userSubscriptionRepository.findBySubscriptionIdAndType(
        userSubscription.subscriptionId as number,
        UserSubscriptionType.Regular
      )
      if (regularUserSubscriptions.length === 0) {
        this.logger.warn(`Could not find a regular user subscription for user with uuid: ${event.payload.userUuid}`)

        return
      }

      userSubscription = regularUserSubscriptions[0]
    }

    const bytesUsedSetting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: (await userSubscription.user).uuid,
      userSubscriptionUuid: userSubscription.uuid,
      settingName: SettingName.FileUploadBytesUsed,
    })
    if (bytesUsedSetting === undefined) {
      this.logger.warn(`Could not find bytes used setting for user with uuid: ${event.payload.userUuid}`)

      return
    }

    const bytesUsed = bytesUsedSetting.value as string

    await this.subscriptionSettingService.createOrReplace({
      userSubscription,
      props: {
        name: SettingName.FileUploadBytesUsed,
        unencryptedValue: (+(bytesUsed) - event.payload.fileByteSize).toString(),
        sensitive: false,
      },
    })
  }
}
