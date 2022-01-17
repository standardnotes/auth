import 'reflect-metadata'

import { SessionTokenData, TokenDecoderInterface } from '@standardnotes/auth'

import { RevokedSession } from '../Session/RevokedSession'
import { Session } from '../Session/Session'
import { SessionServiceInterace } from '../Session/SessionServiceInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'

import { AuthenticationMethodResolver } from './AuthenticationMethodResolver'

describe('AuthenticationMethodResolver', () => {
  let userRepository: UserRepositoryInterface
  let sessionService: SessionServiceInterace
  let sessionTokenDecoder: TokenDecoderInterface<SessionTokenData>
  let fallbackTokenDecoder: TokenDecoderInterface<SessionTokenData>
  let user: User
  let session: Session
  let revokedSession: RevokedSession

  const createResolver = () => new AuthenticationMethodResolver(userRepository, sessionService, sessionTokenDecoder, fallbackTokenDecoder)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    session = {} as jest.Mocked<Session>

    revokedSession = {} as jest.Mocked<RevokedSession>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    sessionService = {} as jest.Mocked<SessionServiceInterace>
    sessionService.getSessionFromToken = jest.fn()
    sessionService.getRevokedSessionFromToken = jest.fn()
    sessionService.markRevokedSessionAsReceived = jest.fn().mockReturnValue(revokedSession)

    sessionTokenDecoder = {} as jest.Mocked<TokenDecoderInterface<SessionTokenData>>
    sessionTokenDecoder.decodeToken = jest.fn()

    fallbackTokenDecoder = {} as jest.Mocked<TokenDecoderInterface<SessionTokenData>>
    fallbackTokenDecoder.decodeToken = jest.fn()
  })

  it('should resolve jwt authentication method', async () => {
    sessionTokenDecoder.decodeToken = jest.fn().mockReturnValue({ user_uuid: '123' })

    expect(await createResolver().resolve('test')).toEqual({
      claims: {
        user_uuid: '123',
      },
      type: 'jwt',
      user,
    })
  })

  it('should resolve session authentication method', async () => {
    sessionService.getSessionFromToken = jest.fn().mockReturnValue(session)

    expect(await createResolver().resolve('test')).toEqual({
      session,
      type: 'session_token',
      user,
    })
  })

  it('should resolve archvied session authentication method', async () => {
    sessionService.getRevokedSessionFromToken = jest.fn().mockReturnValue(revokedSession)

    expect(await createResolver().resolve('test')).toEqual({
      revokedSession,
      type: 'revoked',
    })

    expect(sessionService.markRevokedSessionAsReceived).toHaveBeenCalled()
  })

  it('should indicated that authentication method cannot be resolved', async () => {
    expect(await createResolver().resolve('test')).toBeUndefined
  })
})
