import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'

import TYPES from '../Bootstrap/Types'
import { SessionServiceInterface } from '../Domain/Session/SessionServiceInterface'
import { SignIn } from '../Domain/UseCase/SignIn'
import { ClearLoginAttempts } from '../Domain/UseCase/ClearLoginAttempts'
import { VerifyMFA } from '../Domain/UseCase/VerifyMFA'
import { IncreaseLoginAttempts } from '../Domain/UseCase/IncreaseLoginAttempts'
import { Logger } from 'winston'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { Register } from '../Domain/UseCase/Register'
import { DomainEventFactoryInterface } from '../Domain/Event/DomainEventFactoryInterface'
import { ErrorTag } from '@standardnotes/common'

@controller('/auth')
export class AuthController extends BaseHttpController {
  constructor(
    @inject(TYPES.SessionService) private sessionService: SessionServiceInterface,
    @inject(TYPES.VerifyMFA) private verifyMFA: VerifyMFA,
    @inject(TYPES.SignIn) private signInUseCase: SignIn,
    @inject(TYPES.GetUserKeyParams) private getUserKeyParams: GetUserKeyParams,
    @inject(TYPES.ClearLoginAttempts) private clearLoginAttempts: ClearLoginAttempts,
    @inject(TYPES.IncreaseLoginAttempts) private increaseLoginAttempts: IncreaseLoginAttempts,
    @inject(TYPES.Register) private registerUser: Register,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    super()
  }

  @httpGet('/params', TYPES.AuthMiddlewareWithoutResponse)
  async params(request: Request, response: Response): Promise<results.JsonResult> {
    if (response.locals.session) {
      const result = await this.getUserKeyParams.execute({
        email: response.locals.user.email,
        authenticated: true,
        authenticatedUser: response.locals.user,
      })

      return this.json(result.keyParams)
    }

    if (!request.query.email) {
      return this.json({
        error: {
          message: 'Please provide an email address.',
        },
      }, 400)
    }

    const verifyMFAResponse = await this.verifyMFA.execute({
      email: <string> request.query.email,
      requestParams: request.query,
      preventOTPFromFurtherUsage: false,
    })

    if (!verifyMFAResponse.success) {
      return this.json({
        error: {
          tag: verifyMFAResponse.errorTag,
          message: verifyMFAResponse.errorMessage,
          payload: verifyMFAResponse.errorPayload,
        },
      }, 401)
    }

    const result = await this.getUserKeyParams.execute({
      email: <string> request.query.email,
      authenticated: false,
    })

    return this.json(result.keyParams)
  }

  @httpPost('/sign_in', TYPES.LockMiddleware)
  async signIn(request: Request): Promise<results.JsonResult> {
    if (!request.body.email || !request.body.password) {
      this.logger.debug('/auth/sign_in request missing credentials: %O', request.body)

      return this.json({
        error: {
          tag: 'invalid-auth',
          message: 'Invalid login credentials.',
        },
      }, 401)
    }

    const verifyMFAResponse = await this.verifyMFA.execute({
      email: request.body.email,
      requestParams: request.body,
      preventOTPFromFurtherUsage: true,
    })

    if (!verifyMFAResponse.success) {
      return this.json({
        error: {
          tag: verifyMFAResponse.errorTag,
          message: verifyMFAResponse.errorMessage,
          payload: verifyMFAResponse.errorPayload,
        },
      }, 401)
    }

    const signInResult = await this.signInUseCase.execute({
      apiVersion: request.body.api,
      userAgent: <string> request.headers['user-agent'],
      email: request.body.email,
      password: request.body.password,
      ephemeralSession: request.body.ephemeral ?? false,
    })

    if (!signInResult.success) {
      await this.increaseLoginAttempts.execute({ email: request.body.email })

      return this.json({
        error: {
          message: signInResult.errorMessage,
        },
      }, 401)
    }

    await this.clearLoginAttempts.execute({ email: request.body.email })

    return this.json(signInResult.authResponse)
  }

  @httpPost('/pkce_params', TYPES.AuthMiddlewareWithoutResponse)
  async pkceParams(request: Request, response: Response): Promise<results.JsonResult> {
    if (!request.body.code_challenge) {
      return this.json({
        error: {
          message: 'Please provide the code challenge parameter.',
        },
      }, 400)
    }

    if (response.locals.session) {
      const result = await this.getUserKeyParams.execute({
        email: response.locals.user.email,
        authenticated: true,
        authenticatedUser: response.locals.user,
        codeChallenge: request.body.code_challenge as string,
      })

      return this.json(result.keyParams)
    }

    if (!request.body.email) {
      return this.json({
        error: {
          message: 'Please provide an email address.',
        },
      }, 400)
    }

    const verifyMFAResponse = await this.verifyMFA.execute({
      email: <string> request.body.email,
      requestParams: request.body,
      preventOTPFromFurtherUsage: true,
    })

    if (!verifyMFAResponse.success) {
      return this.json({
        error: {
          tag: verifyMFAResponse.errorTag,
          message: verifyMFAResponse.errorMessage,
          payload: verifyMFAResponse.errorPayload,
        },
      }, 401)
    }

    const result = await this.getUserKeyParams.execute({
      email: <string> request.body.email,
      authenticated: false,
      codeChallenge: request.body.code_challenge as string,
    })

    return this.json(result.keyParams)
  }

  @httpPost('/pkce_sign_in', TYPES.LockMiddleware)
  async pkceSignIn(request: Request): Promise<results.JsonResult> {
    if (!request.body.email || !request.body.password || !request.body.code_verifier) {
      this.logger.debug('/auth/sign_in request missing credentials: %O', request.body)

      return this.json({
        error: {
          tag: 'invalid-auth',
          message: 'Invalid login credentials.',
        },
      }, 401)
    }

    const signInResult = await this.signInUseCase.execute({
      apiVersion: request.body.api,
      userAgent: <string> request.headers['user-agent'],
      email: request.body.email,
      password: request.body.password,
      ephemeralSession: request.body.ephemeral ?? false,
      codeVerifier: request.body.code_verifier,
    })

    if (!signInResult.success) {
      await this.increaseLoginAttempts.execute({ email: request.body.email })

      return this.json({
        error: {
          message: signInResult.errorMessage,
        },
      }, 401)
    }

    await this.clearLoginAttempts.execute({ email: request.body.email })

    return this.json(signInResult.authResponse)
  }

  @httpPost('/sign_out', TYPES.AuthMiddlewareWithoutResponse)
  async signOut(request: Request, response: Response): Promise<results.JsonResult | results.StatusCodeResult> {
    if (response.locals.readOnlyAccess) {
      return this.json({
        error: {
          tag: ErrorTag.ReadOnlyAccess,
          message: 'Session has read-only access.',
        },
      }, 401)
    }

    const authorizationHeader = <string> request.headers.authorization

    await this.sessionService.deleteSessionByToken(authorizationHeader.replace('Bearer ', ''))

    return this.statusCode(204)
  }

  @httpPost('/')
  async register(request: Request): Promise<results.JsonResult> {
    if (!request.body.email || !request.body.password) {
      return this.json({
        error: {
          message: 'Please enter an email and a password to register.',
        },
      }, 400)
    }

    const registerResult = await this.registerUser.execute({
      email: request.body.email,
      password: request.body.password,
      updatedWithUserAgent: <string> request.headers['user-agent'],
      apiVersion: request.body.api,
      ephemeralSession: request.body.ephemeral ?? false,
      pwFunc: request.body.pw_func,
      pwAlg: request.body.pw_alg,
      pwCost: request.body.pw_cost,
      pwKeySize: request.body.pw_key_size,
      pwNonce: request.body.pw_nonce,
      pwSalt: request.body.pw_salt,
      kpOrigination: request.body.origination,
      kpCreated: request.body.created,
      version: request.body.version ? request.body.version :
        request.body.pw_nonce ? '001' : '002',
    })

    if (!registerResult.success || !registerResult.authResponse) {
      return this.json({
        error: {
          message: registerResult.errorMessage,
        },
      }, 400)
    }

    await this.clearLoginAttempts.execute({ email: registerResult.authResponse.user.email as string })

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createUserRegisteredEvent(
        <string> registerResult.authResponse.user.uuid,
        <string> registerResult.authResponse.user.email,
      )
    )

    return this.json(registerResult.authResponse)
  }
}
