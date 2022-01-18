import { inject, injectable } from 'inversify'
import { UpdateSettingDto } from './UpdateSettingDto'
import { UpdateSettingResponse } from './UpdateSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { CreateOrReplaceSettingResponse } from '../../Setting/CreateOrReplaceSettingResponse'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Logger } from 'winston'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { User } from '../../User/User'
import { SettingName } from '@standardnotes/settings'
import { RoleServiceInterface } from '../../Role/RoleServiceInterface'
import { SettingsAssociationServiceInterface } from '../../Setting/SettingsAssociationServiceInterface'

@injectable()
export class UpdateSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
    @inject(TYPES.SettingsAssociationService) private settingsAssociationService: SettingsAssociationServiceInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.RoleService) private roleService: RoleServiceInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async execute(dto: UpdateSettingDto): Promise<UpdateSettingResponse> {
    if (!Object.values(SettingName).includes(dto.props.name as SettingName)) {
      return {
        success: false,
        error: {
          message: `Setting name ${dto.props.name} is invalid.`,
        },
        statusCode: 400,
      }
    }

    this.logger.debug('[%s] Updating setting: %O', dto.userUuid, dto)

    const { userUuid, props } = dto

    const user = await this.userRepository.findOneByUuid(userUuid)

    if (user === undefined) {
      return {
        success: false,
        error: {
          message: `User ${userUuid} not found.`,
        },
        statusCode: 404,
      }
    }

    if (!await this.userHasPermissionToUpdateSetting(user, props.name as SettingName)) {
      return {
        success: false,
        error: {
          message: `User ${userUuid} is not permitted to change the setting.`,
        },
        statusCode: 401,
      }
    }

    props.serverEncryptionVersion = this.settingsAssociationService.getEncryptionVersionForSetting(props.name as SettingName)
    props.sensitive = this.settingsAssociationService.getSensitivityForSetting(props.name as SettingName)

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

  private async userHasPermissionToUpdateSetting(user: User, settingName: SettingName): Promise<boolean> {
    const settingIsMutableByClient = await this.settingsAssociationService.isSettingMutableByClient(settingName)
    if (!settingIsMutableByClient) {
      return false
    }

    const permissionAssociatedWithSetting = this.settingsAssociationService.getPermissionAssociatedWithSetting(settingName)
    if (permissionAssociatedWithSetting === undefined) {
      return true
    }

    return this.roleService.userHasPermission(user.uuid, permissionAssociatedWithSetting)
  }
}
