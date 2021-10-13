import { verify } from 'jsonwebtoken'

import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { TokenDecoderInterface } from './TokenDecoderInterface'
import { OfflineFeaturesTokenData, Token } from '@standardnotes/auth'

@injectable()
export class TokenDecoder implements TokenDecoderInterface {
  constructor(
    @inject(TYPES.JWT_SECRET) private jwtSecret: string,
    @inject(TYPES.LEGACY_JWT_SECRET) private legacyJwtSecret: string,
    @inject(TYPES.AUTH_JWT_SECRET) private authJwtSecret: string,
  ) {
  }

  decodeOfflineToken(token: string): OfflineFeaturesTokenData | undefined {
    try {
      const valueBuffer = Buffer.from(token, 'base64')
      const decodedValue = valueBuffer.toString()

      const tokenObject = JSON.parse(decodedValue)

      if ('extensionKey' in tokenObject && tokenObject.extensionKey) {
        return tokenObject
      }

      return undefined
    } catch (error) {
      return undefined
    }
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
