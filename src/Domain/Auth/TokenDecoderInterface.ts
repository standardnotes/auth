import { OfflineFeaturesTokenData, Token } from '@standardnotes/auth'

export interface TokenDecoderInterface {
  decodeSessionToken(token: string): Record<string, unknown> | undefined
  decodeCrossServiceCommunicationToken(token: string): Token | undefined
  decodeOfflineToken(token: string): OfflineFeaturesTokenData | undefined
}
