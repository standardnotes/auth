import { inject, injectable } from 'inversify'
import { SubscriptionName, Uuid } from '@standardnotes/common'
import { TimerInterface } from '@standardnotes/time'
import { TokenEncoderInterface, ValetTokenData } from '@standardnotes/auth'
import { CreateValetTokenPayload } from '@standardnotes/payloads'
import { SettingName } from '@standardnotes/settings'
import { CreateValetTokenResponseData } from '@standardnotes/responses'

import TYPES from '../../../Bootstrap/Types'
import { UseCaseInterface } from '../UseCaseInterface'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { SettingsAssociationServiceInterface } from '../../Setting/SettingsAssociationServiceInterface'
import { UserSubscription } from '../../Subscription/UserSubscription'
import { UserSubscriptionType } from '../../Subscription/UserSubscriptionType'
import { SubscriptionSettingServiceInterface } from '../../Setting/SubscriptionSettingServiceInterface'

import { CreateValetTokenDTO } from './CreateValetTokenDTO'

@injectable()
export class CreateValetToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.ValetTokenEncoder) private tokenEncoder: TokenEncoderInterface<ValetTokenData>,
    @inject(TYPES.SubscriptionSettingService) private subscriptionSettingService: SubscriptionSettingServiceInterface,
    @inject(TYPES.SettingsAssociationService) private settingsAssociationService: SettingsAssociationServiceInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
    @inject(TYPES.VALET_TOKEN_TTL) private valetTokenTTL: number,
  ) {
  }

  async execute(dto: CreateValetTokenDTO): Promise<CreateValetTokenResponseData> {
    const { userUuid, ...payload } = dto
    const { userSubscription, subscriptionUserUuid } = await this.getRegularSubscriptionAndAssociatedUserUuid(userUuid)
    if (userSubscription === undefined || subscriptionUserUuid === undefined) {
      return {
        success: false,
        reason: 'no-subscription',
      }
    }

    if (userSubscription.endsAt < this.timer.getTimestampInMicroseconds()) {
      return {
        success: false,
        reason: 'expired-subscription',
      }
    }

    if (!this.isValidWritePayload(payload)) {
      return {
        success: false,
        reason: 'invalid-parameters',
      }
    }

    let uploadBytesUsed = 0
    const uploadBytesUsedSetting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: subscriptionUserUuid,
      userSubscriptionUuid: userSubscription.uuid,
      settingName: SettingName.FileUploadBytesUsed,
    })
    if (uploadBytesUsedSetting !== undefined) {
      uploadBytesUsed = +(uploadBytesUsedSetting.value as string)
    }

    const defaultUploadBytesLimitForSubscription = await this.settingsAssociationService.getFileUploadLimit(userSubscription.planName as SubscriptionName)
    let uploadBytesLimit = defaultUploadBytesLimitForSubscription
    const overwriteWithUserUploadBytesLimitSetting = await this.subscriptionSettingService.findSubscriptionSettingWithDecryptedValue({
      userUuid: subscriptionUserUuid,
      userSubscriptionUuid: userSubscription.uuid,
      settingName: SettingName.FileUploadBytesLimit,
    })
    if (overwriteWithUserUploadBytesLimitSetting !== undefined) {
      uploadBytesLimit = +(overwriteWithUserUploadBytesLimitSetting.value as string)
    }

    const tokenData: ValetTokenData = {
      userUuid: dto.userUuid,
      permittedOperation: dto.operation,
      permittedResources: dto.resources,
      uploadBytesUsed,
      uploadBytesLimit,
    }

    const valetToken = this.tokenEncoder.encodeExpirableToken(tokenData, this.valetTokenTTL)

    return { success: true, valetToken }
  }

  private isValidWritePayload(payload: CreateValetTokenPayload) {
    if (payload.operation === 'write') {
      for (const resource of payload.resources) {
        if (resource.unencryptedFileSize === undefined) {
          return false
        }
      }
    }

    return true
  }

  private async getRegularSubscriptionAndAssociatedUserUuid(userUuid: Uuid): Promise<{
    userSubscription: UserSubscription | undefined,
    subscriptionUserUuid: Uuid | undefined,
  }> {
    const userSubscription = await this.userSubscriptionRepository.findOneByUserUuid(userUuid)
    if (userSubscription === undefined) {
      return {
        userSubscription: undefined,
        subscriptionUserUuid: userUuid,
      }
    }

    if (userSubscription.subscriptionType === UserSubscriptionType.Regular) {
      return {
        userSubscription,
        subscriptionUserUuid: userUuid,
      }
    }

    const regularSubscriptions = await this.userSubscriptionRepository.findBySubscriptionIdAndType(userSubscription.subscriptionId as number, UserSubscriptionType.Regular)

    let regularSubscriptionUserUuid = undefined
    if (regularSubscriptions.length > 0) {
      regularSubscriptionUserUuid = (await regularSubscriptions[0].user).uuid
    }

    return {
      userSubscription: regularSubscriptions[0],
      subscriptionUserUuid: regularSubscriptionUserUuid,
    }
  }
}
