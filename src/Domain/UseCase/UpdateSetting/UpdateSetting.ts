import { inject, injectable } from 'inversify'
import { UpdateSettingDto } from './UpdateSettingDto'
import { UpdateSettingResponse } from './UpdateSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { CreateOrReplaceSettingResponse } from '../../Setting/CreateOrReplaceSettingResponse'
import { SettingService } from '../../Setting/SettingService'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Logger } from 'winston'
import { CrypterInterface } from '../../Encryption/CrypterInterface'
import { Setting } from '../../Setting/Setting'

@injectable()
export class UpdateSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingService) private settingService: SettingService,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async execute(dto: UpdateSettingDto): Promise<UpdateSettingResponse> {
    this.logger.debug('Updating setting: %O', dto)

    const { userUuid, props } = dto

    const user = await this.userRepository.findOneByUuid(userUuid)

    if (user === undefined) {
      return {
        success: false,
        error: {
          message: `User ${userUuid} not found.`,
        },
      }
    }

    if (props.serverEncryptionVersion !== Setting.ENCRYPTION_VERSION_UNENCRYPTED) {
      props.value = await this.crypter.encryptForUser(props.value, user)
    }

    const response = await this.settingService.createOrReplace({
      user,
      props,
    })

    return {
      success: true,
      setting: await this.settingProjector.projectSimple(response.setting),
      statusCode: this.statusToStatusCode(response),
    }
  }

  /* istanbul ignore next */
  private statusToStatusCode(response: CreateOrReplaceSettingResponse): number {
    if (response.status === 'created') {
      return 201
    }
    if (response.status === 'replaced') {
      return 200
    }

    const exhaustiveCheck: never = response.status
    throw new Error(`Unrecognized status: ${exhaustiveCheck}!`)
  }
}
