import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { KeyParamsFactoryInterface } from '../../User/KeyParamsFactoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetUserKeyParamsDTO } from './GetUserKeyParamsDTO'
import { GetUserKeyParamsResponse } from './GetUserKeyParamsResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import { Logger } from 'winston'

@injectable()
export class GetUserKeyParams implements UseCaseInterface {
  constructor (
    @inject(TYPES.KeyParamsFactory) private keyParamsFactory: KeyParamsFactoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
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

    const user = await this.userRepository.findOneByEmail(dto.email)
    if (!user) {
      this.logger.debug(`No user with email ${dto.email}. Creating pseudo key params.`)

      return {
        keyParams: this.keyParamsFactory.createPseudoParams(dto.email),
      }
    }

    this.logger.debug(`Creating key params for user ${user.email}. Authentication: ${dto.authenticated}`)

    return {
      keyParams: this.keyParamsFactory.create(user, dto.authenticated),
    }
  }
}
