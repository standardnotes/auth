import { SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
import { FindSettingDTO } from './FindSettingDTO'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'
import { SettingServiceInterface } from './SettingServiceInterface'

@injectable()
export class SettingService implements SettingServiceInterface {
  constructor(
    @inject(TYPES.SettingFactory) private factory: SettingFactory,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async findSetting(dto: FindSettingDTO): Promise<Setting | undefined> {
    let setting: Setting | undefined
    if (dto.settingUuid !== undefined) {
      setting = await this.settingRepository.findOneByUuid(dto.settingUuid)
    } else {
      setting = await this.settingRepository.findLastByNameAndUserUuid(dto.settingName, dto.userUuid)
    }

    if (setting === undefined) {
      return undefined
    }

    if (setting.value !== null &&
      (
        setting.serverEncryptionVersion === Setting.ENCRYPTION_VERSION_DEFAULT ||
        setting.serverEncryptionVersion === Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED
      )
    ) {
      const user = await this.userRepository.findOneByUuid(dto.userUuid)

      if (user === undefined) {
        return undefined
      }

      setting.value = await this.crypter.decryptForUser(setting.value, user)
    }

    return setting
  }

  async createOrReplace(dto: CreateOrReplaceSettingDto): Promise<CreateOrReplaceSettingResponse> {
    const { user, props } = dto

    const existing = await this.findSetting({
      userUuid: user.uuid,
      settingName: props.name as SettingName,
      settingUuid: props.uuid,
    })

    if (existing === undefined) {
      const setting = await this.settingRepository.save(await this.factory.create(props, user))

      this.logger.debug('[%s] Created setting %s: %O', user.uuid, props.name, setting)

      return {
        status: 'created',
        setting,
      }
    }

    const setting = await this.settingRepository.save(await this.factory.createReplacement(existing, props))

    this.logger.debug('[%s] Replaced existing setting %s with: %O', user.uuid, props.name, setting)

    return {
      status: 'replaced',
      setting,
    }
  }
}
