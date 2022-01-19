import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SessionTokenData,
  TokenEncoderInterface,
} from '@standardnotes/auth'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { ProjectorInterface } from '../../Projection/ProjectorInterface'
import { SessionPayload } from '../Session/SessionPayload'
import { SessionServiceInterace } from '../Session/SessionServiceInterface'
import { KeyParamsFactoryInterface } from '../User/KeyParamsFactoryInterface'
import { User } from '../User/User'
import { AuthResponse20161215 } from './AuthResponse20161215'
import { AuthResponse20200115 } from './AuthResponse20200115'
import { AuthResponseFactory20190520 } from './AuthResponseFactory20190520'

@injectable()
export class AuthResponseFactory20200115 extends AuthResponseFactory20190520 {
  constructor(
    @inject(TYPES.SessionService) private sessionService: SessionServiceInterace,
    @inject(TYPES.KeyParamsFactory) private keyParamsFactory: KeyParamsFactoryInterface,
    @inject(TYPES.UserProjector) userProjector: ProjectorInterface<User>,
    @inject(TYPES.SessionTokenEncoder) protected tokenEncoder: TokenEncoderInterface<SessionTokenData>,
    @inject(TYPES.Logger) logger: Logger
  ) {
    super(
      userProjector,
      tokenEncoder,
      logger
    )
  }

  async createResponse(user: User, apiVersion: string, userAgent: string, ephemeralSession: boolean): Promise<AuthResponse20161215 | AuthResponse20200115> {
    if (!user.supportsSessions()) {
      this.logger.debug(`User ${user.uuid} does not support sessions. Falling back to JWT auth response`)

      return super.createResponse(user)
    }

    const sessionPayload = await this.createSession(user, apiVersion, userAgent, ephemeralSession)

    this.logger.debug('Created session payload for user %s: %O', user.uuid, sessionPayload)

    return {
      session: sessionPayload,
      key_params: this.keyParamsFactory.create(user, true),
      user: this.userProjector.projectSimple(user),
    }
  }

  private async createSession(user: User, apiVersion: string, userAgent: string, ephemeralSession: boolean): Promise<SessionPayload> {
    if (ephemeralSession) {
      return this.sessionService.createNewEphemeralSessionForUser(user, apiVersion, userAgent)
    }

    return this.sessionService.createNewSessionForUser(user, apiVersion, userAgent)
  }
}
