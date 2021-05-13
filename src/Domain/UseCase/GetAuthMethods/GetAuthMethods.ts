import { inject, injectable } from 'inversify'
import { GetAuthMethodsDto } from './GetAuthMethodsDto'
import { GetAuthMethodsResponse } from './GetAuthMethodsResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { MfaSetting } from '@standardnotes/auth'

@injectable()
export class GetAuthMethods implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
  ) {}

  async execute(dto: GetAuthMethodsDto): Promise<GetAuthMethodsResponse> {
    const { email } = dto

    const user = await this.userRepository.findOneByEmail(email)

    if (user === undefined) {
      return this.getPseudoMethods()
    }

    const mfaSetting = await this.settingRepository.findOneByNameAndUserUuid(
      MfaSetting.MfaSecret,
      user.uuid,
    )

    return {
      success: true,
      methods: {
        ...(mfaSetting === undefined? {}: { totp: true }),
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
