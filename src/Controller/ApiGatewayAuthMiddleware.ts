import { TokenDecoderInterface } from '@standardnotes/auth'
import { NextFunction, Request, Response } from 'express'
import { inject, injectable } from 'inversify'
import { BaseMiddleware } from 'inversify-express-utils'
import { Logger } from 'winston'
import TYPES from '../Bootstrap/Types'

@injectable()
export class ApiGatewayAuthMiddleware extends BaseMiddleware {
  constructor (
    @inject(TYPES.TokenDecoder) private tokenDecoder: TokenDecoderInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    super()
  }

  async handler (request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      if (!request.headers['x-auth-token']) {
        this.logger.debug('ApiGatewayAuthMiddleware missing x-auth-token header.')

        response.status(401).send({
          error: {
            tag: 'invalid-auth',
            message: 'Invalid login credentials.',
          },
        })

        return
      }

      const token = this.tokenDecoder.decodeCrossServiceCommunicationToken(request.headers['x-auth-token'] as string)

      if (token === undefined) {
        this.logger.debug('ApiGatewayAuthMiddleware authentication failure.')

        response.status(401).send({
          error: {
            tag: 'invalid-auth',
            message: 'Invalid login credentials.',
          },
        })

        return
      }

      response.locals.user = token.user
      response.locals.roles = token.roles
      response.locals.session = token.session

      return next()
    } catch (error) {
      return next(error)
    }
  }
}
