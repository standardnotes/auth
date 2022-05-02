import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { KeyParamsFactoryInterface } from '../../User/KeyParamsFactoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserKeyParamsDTO } from './GetUserKeyParamsDTO'
import { GetUserKeyParamsResponse } from './GetUserKeyParamsResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import { Logger } from 'winston'
import { User } from '../../User/User'
import { PKCERepositoryInterface } from '../../User/PKCERepositoryInterface'
import { GetUserKeyParamsDTOV2Challenged } from './GetUserKeyParamsDTOV2Challenged'

@injectable()
export class GetUserKeyParams implements UseCaseInterface {
  constructor (
    @inject(TYPES.KeyParamsFactory) private keyParamsFactory: KeyParamsFactoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.PKCERepository) private pkceRepository: PKCERepositoryInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async execute(dto: GetUserKeyParamsDTO): Promise<GetUserKeyParamsResponse> {
    if (dto.authenticatedUser) {
      this.logger.debug(`Creating key params for authenticated user ${dto.authenticatedUser.email}`)

      return {
        keyParams: this.keyParamsFactory.create(dto.authenticatedUser, true),
      }
    }

    let user: User | undefined
    if (dto.email !== undefined) {
      user = await this.userRepository.findOneByEmail(dto.email)
      if (!user) {
        this.logger.debug(`No user with email ${dto.email}. Creating pseudo key params.`)

        return {
          keyParams: this.keyParamsFactory.createPseudoParams(dto.email),
        }
      }
    } else if (dto.userUuid) {
      user = await this.userRepository.findOneByUuid(dto.userUuid)
    }

    if (!user) {
      this.logger.debug('Could not find user with given parameters: %O', dto)

      throw Error('Could not find user')
    }

    this.logger.debug(`Creating key params for user ${user.email}. Authentication: ${dto.authenticated}`)

    const keyParams = this.keyParamsFactory.create(user, dto.authenticated)

    if (this.isCodeChallengedVersion(dto)) {
      await this.pkceRepository.storeCodeChallenge(dto.codeChallenge)
    }

    return {
      keyParams,
    }
  }

  private isCodeChallengedVersion(dto: unknown): dto is GetUserKeyParamsDTOV2Challenged {
    return typeof dto === 'object' && dto !== null && 'codeChallenge' in dto
  }
}
