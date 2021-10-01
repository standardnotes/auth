import { verify } from 'jsonwebtoken'

import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { TokenDecoderInterface } from './TokenDecoderInterface'
import { Token } from '@standardnotes/auth'

@injectable()
export class TokenDecoder implements TokenDecoderInterface {
  constructor(
    @inject(TYPES.JWT_SECRET) private jwtSecret: string,
    @inject(TYPES.LEGACY_JWT_SECRET) private legacyJwtSecret: string,
    @inject(TYPES.AUTH_JWT_SECRET) private authJwtSecret: string,
  ) {
  }

  decodeCrossServiceCommunicationToken(token: string): Token | undefined {
    try {
      return <Token> verify(token, this.authJwtSecret, {
        algorithms: [ 'HS256' ],
      })
    } catch (error) {
      return undefined
    }
  }

  decodeSessionToken(token: string): Record<string, unknown> | undefined {
    try {
      return <Record<string, unknown>> verify(token, this.jwtSecret, {
        algorithms: [ 'HS256' ],
      })
    } catch (error) {
      try {
        return <Record<string, unknown>> verify(token, this.legacyJwtSecret, {
          algorithms: [ 'HS256' ],
        })
      } catch (legacyError) {
        return undefined
      }
    }
  }
}
