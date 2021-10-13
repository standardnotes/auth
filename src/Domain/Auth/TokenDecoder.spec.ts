import 'reflect-metadata'

import { TokenDecoder } from './TokenDecoder'

describe('TokenDecoder', () => {
  const jwtSecret = 'secret'
  const legacyJwtSecret = 'legacy_secret'
  const authJwtSecret = 'auth_secret'

  const createDecoder = () => new TokenDecoder(jwtSecret, legacyJwtSecret, authJwtSecret)

  it('should decode a session token', () => {
    expect(createDecoder().decodeSessionToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcl91dWlkIjoiMTIzIiwicHdfaGFzaCI6IjlmODZkMDgxODg0YzdkNjU5YTJmZWFhMGM1NWFkMDE1YTNiZjRmMWIyYjBiODIyY2QxNWQ2YzE1YjBmMDBhMDgiLCJpYXQiOjE1MTYyMzkwMjJ9.TXDPCbCAITDjcUUorHsF4S5Nxkz4eFE4F3TPCsKI89A'))
      .toEqual({
        iat: 1516239022,
        pw_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        sub: '1234567890',
        user_uuid: '123',
      })
  })

  it('should decode a session token encoded with legacy secret', () => {
    expect(createDecoder().decodeSessionToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcl91dWlkIjoiMTIzIiwicHdfaGFzaCI6IjlmODZkMDgxODg0YzdkNjU5YTJmZWFhMGM1NWFkMDE1YTNiZjRmMWIyYjBiODIyY2QxNWQ2YzE1YjBmMDBhMDgiLCJpYXQiOjE1MTYyMzkwMjJ9.g32nbZ046pRwSe1iHwWEfsNNBRnAKqXshQKRtCuX1Zw'))
      .toEqual({
        iat: 1516239022,
        pw_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        sub: '1234567890',
        user_uuid: '123',
      })
  })

  it('should not decode a session token with wrong encoding', () => {
    expect(createDecoder().decodeSessionToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyqeqwJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcl91dWlkIjoiMTIzIiwicHdfaGFzaCI6IjlmODZkMDgxODg0YzdkNjU5YTJmZWFhMGM1NWFkMDE1YTNiZjRmMWIyYjBiODIyY2QxNWQ2YzE1YjBmMDBhMDgiLCJpYXQiOjE1MTYyMzkwMjJ9.g32nbZ046pRwSe1iHwWEfsNNBRnAKqXshQKRtCuX1Zw'))
      .toBeUndefined()
  })

  it('should decode a cross service communication token', () => {
    expect(createDecoder().decodeCrossServiceCommunicationToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsInB3X2hhc2giOiI5Zjg2ZDA4MTg4NGM3ZDY1OWEyZmVhYTBjNTVhZDAxNWEzYmY0ZjFiMmIwYjgyMmNkMTVkNmMxNWIwZjAwYTA4Iiwic3ViIjoiMTIzNDU2Nzg5MCIsInVzZXJfdXVpZCI6IjEyMyJ9.ceErkJke7Jqlcd5yCC7hwyb8OrLgRKyWKCbDwjxlV-U'))
      .toEqual({
        iat: 1516239022,
        pw_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        sub: '1234567890',
        user_uuid: '123',
      })
  })

  it('should not decode a cross service communication token with wrong encoding', () => {
    expect(createDecoder().decodeCrossServiceCommunicationToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyqeqwJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcl91dWlkIjoiMTIzIiwicHdfaGFzaCI6IjlmODZkMDgxODg0YzdkNjU5YTJmZWFhMGM1NWFkMDE1YTNiZjRmMWIyYjBiODIyY2QxNWQ2YzE1YjBmMDBhMDgiLCJpYXQiOjE1MTYyMzkwMjJ9.g32nbZ046pRwSe1iHwWEfsNNBRnAKqXshQKRtCuX1Zw'))
      .toBeUndefined()
  })

  it('should decode an offline token', () => {
    expect(createDecoder().decodeOfflineToken('ewogICJleHRlbnNpb25LZXkiOiAidGVzdCIsCiAgImZlYXR1cmVzVXJsIjogImh0dHBzOi8vYXBpLnN0YW5kYXJkbm90ZXMuY29tL3YxL29mZmxpbmUvZmVhdHVyZXMiCn0='))
      .toEqual({
        extensionKey: 'test',
        featuresUrl: 'https://api.standardnotes.com/v1/offline/features',
      })
  })

  it('should not decode a malformed offline token', () => {
    expect(createDecoder().decodeOfflineToken('ewogICJmZWF0dXJlc1VybCI6ICJodHRwczovL2FwaS5zdGFuZGFyZG5vdGVzLmNvbS92MS9vZmZsaW5lL2ZlYXR1cmVzIgp9'))
      .toBeUndefined()
  })

  it('should not decode and offline token that causes parsing error', () => {
    expect(createDecoder().decodeOfflineToken('ewogICJmZWF0dXJlc1VybDogImh0dHBzOi8vYXBpLnN0YW5kYXJkbm90ZXMuY29tL3YxL29mZmxpbmUvZmVhdHVyZXMiCn0='))
      .toBeUndefined()
  })
})
