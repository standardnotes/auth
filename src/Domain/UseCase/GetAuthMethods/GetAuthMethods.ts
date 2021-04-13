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

    if (user === undefined) return this.getPseudoMethods(email)

    const mfaSetting = await this.settingRepository.findOneByNameAndUserUuid(
      SETTINGS.MFA_SECRET, 
      user.uuid,
    )

    const totp = mfaSetting && {
      uuid: mfaSetting.uuid,
    }

    return {
      success: true,
      methods: {
        password: true,
        totp,
      },
    }
  }

  private getPseudoMethods(_email: string): GetAuthMethodsResponse {
    return {
      success: true,
      methods: {
        password: true,
        // PR note: could generate a pseudo totp uuid based on the email, but won't bother and will just default to passwords for non-existent users -- unless this is insufficient?
      },
    }
  }
}
