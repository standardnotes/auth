import { inject, injectable } from 'inversify'
import { GetAuthMethodsDto } from './GetAuthMethodsDto'
import { GetAuthMethodsResponse } from './GetAuthMethodsResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { SETTINGS } from '../../Setting/Settings'

@injectable()
export class GetAuthMethods implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ) {}

  async execute(dto: GetAuthMethodsDto): Promise<GetAuthMethodsResponse> {
    const { email } = dto

    const user = await this.userRepository.findOneByEmail(email)

    if (user === undefined) return this.getPseudoMethods()

    const mfaSetting = await this.settingRepository.findOneByNameAndUserUuid(
      SETTINGS.MFA_SECRET, 
      user.uuid,
    )

    const totp = mfaSetting && {
      mfaSecretUuid: mfaSetting.uuid,
    }

    return {
      success: true,
      methods: {
        totp,
      },
    }
  }

  private getPseudoMethods(): GetAuthMethodsResponse {
    return {
      success: true,
      methods: {},
    }
  }
}
