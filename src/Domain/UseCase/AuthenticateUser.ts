import * as crypto from 'crypto'
import * as dayjs from 'dayjs'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { AuthenticationMethodResolverInterface } from '../Auth/AuthenticationMethodResolverInterface'

import { AuthenticateUserDTO } from './AuthenticateUserDTO'
import { AuthenticateUserResponse } from './AuthenticateUserResponse'
import { UseCaseInterface } from './UseCaseInterface'

@injectable()
export class AuthenticateUser implements UseCaseInterface {
  constructor(
    @inject(TYPES.AuthenticationMethodResolver) private authenticationMethodResolver: AuthenticationMethodResolverInterface,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async execute(dto: AuthenticateUserDTO): Promise<AuthenticateUserResponse> {
    const authenticationMethod = await this.authenticationMethodResolver.resolve(dto.token)
    if (!authenticationMethod) {
      this.logger.debug('No authentication method resolved.')

      return {
        success: false,
        failureType: 'INVALID_AUTH',
      }
    }

    if (authenticationMethod.type === 'revoked') {
      return {
        success: false,
        failureType: 'REVOKED_SESSION',
      }
    }

    const user = authenticationMethod.user
    if (!user) {
      this.logger.debug('No user present in authentication method resolved.')

      return {
        success: false,
        failureType: 'INVALID_AUTH',
      }
    }

    if(authenticationMethod.type == 'jwt' && user.supportsSessions()) {
      this.logger.debug('Authentication method resolved was JWT whereas user supports sessions.')

      return {
        success: false,
        failureType: 'INVALID_AUTH',
      }
    }

    switch(authenticationMethod.type) {
    case 'jwt': {
      const pwHash = <string> (<Record<string, unknown>> authenticationMethod.claims).pw_hash
      const encryptedPasswordDigest = crypto.createHash('sha256').update(user.encryptedPassword).digest('hex')

      if (!pwHash || !crypto.timingSafeEqual(Buffer.from(pwHash), Buffer.from(encryptedPasswordDigest))) {
        this.logger.debug('Password hash and encrypted password digest are not equal.')

        return {
          success: false,
          failureType: 'INVALID_AUTH',
        }
      }
      break
    }
    case 'session_token': {
      const session = authenticationMethod.session
      if (!session) {
        this.logger.debug('No session present in authentication method resolved.')

        return {
          success: false,
          failureType: 'INVALID_AUTH',
        }
      }

      if (session.refreshExpiration < dayjs.utc().toDate()) {
        this.logger.debug('Session refresh expiration date is past due.')

        return {
          success: false,
          failureType: 'INVALID_AUTH',
        }
      }

      if (session.accessExpiration < dayjs.utc().toDate()) {
        return {
          success: false,
          failureType: 'EXPIRED_TOKEN',
        }
      }

      break
    }
    }

    return {
      success: true,
      user,
      session: authenticationMethod.session,
    }
  }
}
