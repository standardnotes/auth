import { inject, injectable } from 'inversify'
import { UpdateSettingDto } from './UpdateSettingDto'
import { UpdateSettingResponse } from './UpdateSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { CreateOrReplaceSettingStatus } from '../../Setting/CreateOrReplaceSettingStatus'

@injectable()
export class UpdateSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ) {}

  async execute(dto: UpdateSettingDto): Promise<UpdateSettingResponse> {
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
    
    const status = await this.settingRepository.createOrReplace({
      user,
      props,
    })

    return { 
      success: true, 
      statusCode: this.statusToStatusCode(status),
    }
  }

  /* istanbul ignore next */
  private statusToStatusCode(status: CreateOrReplaceSettingStatus): number {
    if (status === 'created') {
      return 201
    }
    if (status === 'replaced') {
      return 204
    }

    const exhaustiveCheck: never = status
    throw new Error(`Unrecognized status: ${exhaustiveCheck}!`)
  }
}
