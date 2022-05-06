import { SessionTokenData, TokenDecoderInterface } from '@standardnotes/auth'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { SessionServiceInterface } from '../Session/SessionServiceInterface'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { AuthenticationMethod } from './AuthenticationMethod'
import { AuthenticationMethodResolverInterface } from './AuthenticationMethodResolverInterface'

@injectable()
export class AuthenticationMethodResolver implements AuthenticationMethodResolverInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.SessionService) private sessionService: SessionServiceInterface,
    @inject(TYPES.SessionTokenDecoder) private sessionTokenDecoder: TokenDecoderInterface<SessionTokenData>,
    @inject(TYPES.FallbackSessionTokenDecoder)
    private fallbackSessionTokenDecoder: TokenDecoderInterface<SessionTokenData>,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async resolve(token: string): Promise<AuthenticationMethod | undefined> {
    let decodedToken: SessionTokenData | undefined = this.sessionTokenDecoder.decodeToken(token)
    this.logger.debug('Decoded session token data %O', decodedToken)
    if (decodedToken === undefined) {
      decodedToken = this.fallbackSessionTokenDecoder.decodeToken(token)
    }

    if (decodedToken) {
      return {
        type: 'jwt',
        user: await this.userRepository.findOneByUuid(<string>decodedToken.user_uuid),
        claims: decodedToken,
      }
    }

    const session = await this.sessionService.getSessionFromToken(token)
    this.logger.debug('Retrieved session from token: %O', session)
    if (session) {
      return {
        type: 'session_token',
        user: await this.userRepository.findOneByUuid(session.userUuid),
        session: session,
      }
    }

    const revokedSession = await this.sessionService.getRevokedSessionFromToken(token)
    this.logger.debug('Retrieved revoked session from token: %O', session)
    if (revokedSession) {
      return {
        type: 'revoked',
        revokedSession: await this.sessionService.markRevokedSessionAsReceived(revokedSession),
        user: null,
      }
    }

    this.logger.debug('Could not resolve authentication method')

    return undefined
  }
}
