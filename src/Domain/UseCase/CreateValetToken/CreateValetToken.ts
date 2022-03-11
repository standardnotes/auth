import { inject, injectable } from 'inversify'
import { TokenEncoderInterface, ValetTokenData } from '@standardnotes/auth'
import { CreateValetTokenPayload } from '@standardnotes/payloads'
import { CreateValetTokenResponseData } from '@standardnotes/responses'

import { CreateValetTokenDTO } from './CreateValetTokenDTO'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { SettingName } from '@standardnotes/settings'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'
import { SettingsAssociationServiceInterface } from '../../Setting/SettingsAssociationServiceInterface'
import { SubscriptionName } from '@standardnotes/common'

@injectable()
export class CreateValetToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.ValetTokenEncoder) private tokenEncoder: TokenEncoderInterface<ValetTokenData>,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.SettingsAssociationService) private settingsAssociationService: SettingsAssociationServiceInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
    @inject(TYPES.VALET_TOKEN_TTL) private valetTokenTTL: number,
  ) {
  }

  async execute(dto: CreateValetTokenDTO): Promise<CreateValetTokenResponseData> {
    const { userUuid, ...payload } = dto
    const userSubscription = await this.userSubscriptionRepository.findOneByUserUuid(userUuid)
    if (userSubscription === undefined) {
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
    const uploadBytesUsedSetting = await this.settingService.findSetting({
      userUuid: dto.userUuid,
      settingName: SettingName.FileUploadBytesUsed,
    })
    if (uploadBytesUsedSetting !== undefined) {
      uploadBytesUsed = +(uploadBytesUsedSetting.value as string)
    }

    const defaultUploadBytesLimitForSubscription = await this.settingsAssociationService.getFileUploadLimit(userSubscription.planName as SubscriptionName)
    let uploadBytesLimit = defaultUploadBytesLimitForSubscription
    const overwriteWithUserUploadBytesLimitSetting = await this.settingService.findSetting({
      userUuid: dto.userUuid,
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
}
