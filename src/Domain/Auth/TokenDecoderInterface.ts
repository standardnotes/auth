import { OfflineUserTokenData, Token } from '@standardnotes/auth'

export interface TokenDecoderInterface {
  decodeSessionToken(token: string): Record<string, unknown> | undefined
  decodeCrossServiceCommunicationToken(token: string): Token | undefined
  decodeCrossServiceCommunicationOfflineToken(token: string): OfflineUserTokenData | undefined
}
