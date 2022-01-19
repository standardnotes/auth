import { v4 as uuid } from 'uuid'
import { inject, injectable } from 'inversify'
import { TokenEncoderInterface, ValetTokenData } from '@standardnotes/auth'

import { CreateValetTokenDTO } from './CreateValetTokenDTO'
import { CreateValetTokenResponse } from './CreateValetTokenResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { SettingName } from '@standardnotes/settings'

@injectable()
export class CreateValetToken implements UseCaseInterface {
  constructor(
    @inject(TYPES.ValetTokenEncoder) private tokenEncoder: TokenEncoderInterface<ValetTokenData>,
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.VALET_TOKEN_TTL) private valetTokenTTL: number,
  ) {
  }

  async execute(dto: CreateValetTokenDTO): Promise<CreateValetTokenResponse> {
    let permittedResources = dto.resources ?? []
    if (dto.operation === 'write') {
      permittedResources = [ uuid() ]
    }

    let uploadBytesUsed = 0
    const uploadBytesUsedSetting = await this.settingService.findSetting({
      userUuid: dto.userUuid,
      settingName: SettingName.FileUploadBytesUsed,
    })
    if (uploadBytesUsedSetting !== undefined) {
      uploadBytesUsed = +(uploadBytesUsedSetting.value as string)
    }

    let uploadBytesLimit = 0
    const uploadBytesLimitSetting = await this.settingService.findSetting({
      userUuid: dto.userUuid,
      settingName: SettingName.FileUploadBytesLimit,
    })
    if (uploadBytesLimitSetting !== undefined) {
      uploadBytesLimit = +(uploadBytesLimitSetting.value as string)
    }


    const tokenData: ValetTokenData = {
      userUuid: dto.userUuid,
      permittedOperation: dto.operation,
      permittedResources,
      uploadBytesUsed,
      uploadBytesLimit,
    }

    const valetToken = this.tokenEncoder.encodeExpirableToken(tokenData, this.valetTokenTTL)

    return { success: true, valetToken }
  }
}
