import { NextFunction, Request, Response } from 'express'
import { inject, injectable } from 'inversify'
import { BaseMiddleware } from 'inversify-express-utils'
import { Logger } from 'winston'
import TYPES from '../Bootstrap/Types'
import { TokenDecoderInterface } from '../Domain/Auth/TokenDecoderInterface'

@injectable()
export class ApiGatewayOfflineAuthMiddleware extends BaseMiddleware {
  constructor (
    @inject(TYPES.TokenDecoder) private tokenDecoder: TokenDecoderInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    super()
  }

  async handler (request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      if (!request.headers['x-auth-offline-token']) {
        this.logger.debug('ApiGatewayOfflineAuthMiddleware missing x-auth-offline-token header.')

        response.status(401).send({
          error: {
            tag: 'invalid-auth',
            message: 'Invalid login credentials.',
          },
        })

        return
      }

      const token = this.tokenDecoder.decodeCrossServiceCommunicationOfflineToken(request.headers['x-auth-offline-token'] as string)

      if (token === undefined) {
        this.logger.debug('ApiGatewayOfflineAuthMiddleware authentication failure.')

        response.status(401).send({
          error: {
            tag: 'invalid-auth',
            message: 'Invalid login credentials.',
          },
        })

        return
      }

      response.locals.featuresToken = token.featuresToken
      response.locals.userEmail = token.userEmail

      return next()
    } catch (error) {
      return next(error)
    }
  }
}
