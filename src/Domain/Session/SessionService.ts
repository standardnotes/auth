import * as crypto from 'crypto'
import * as winston from 'winston'
import * as dayjs from 'dayjs'
import * as cryptoRandomString from 'crypto-random-string'
import { UAParser } from 'ua-parser-js'
import { inject, injectable } from 'inversify'
import { v4 as uuidv4 } from 'uuid'
import { TimerInterface } from '@standardnotes/time'

import TYPES from '../../Bootstrap/Types'
import { Session } from './Session'
import { SessionRepositoryInterface } from './SessionRepositoryInterface'
import { SessionServiceInterface } from './SessionServiceInterface'
import { User } from '../User/User'
import { EphemeralSessionRepositoryInterface } from './EphemeralSessionRepositoryInterface'
import { EphemeralSession } from './EphemeralSession'
import { RevokedSession } from './RevokedSession'
import { RevokedSessionRepositoryInterface } from './RevokedSessionRepositoryInterface'
import { SessionBody } from '@standardnotes/responses'

@injectable()
export class SessionService implements SessionServiceInterface {
  static readonly SESSION_TOKEN_VERSION = 1

  constructor (
    @inject(TYPES.SessionRepository) private sessionRepository: SessionRepositoryInterface,
    @inject(TYPES.EphemeralSessionRepository) private ephemeralSessionRepository: EphemeralSessionRepositoryInterface,
    @inject(TYPES.RevokedSessionRepository) private revokedSessionRepository: RevokedSessionRepositoryInterface,
    @inject(TYPES.DeviceDetector) private deviceDetector: UAParser,
    @inject(TYPES.Timer) private timer: TimerInterface,
    @inject(TYPES.Logger) private logger: winston.Logger,
    @inject(TYPES.ACCESS_TOKEN_AGE) private accessTokenAge: number,
    @inject(TYPES.REFRESH_TOKEN_AGE) private refreshTokenAge: number
  ) {
  }

  async createNewSessionForUser(user: User, apiVersion: string, userAgent: string): Promise<SessionBody> {
    const session = this.createSession(user, apiVersion, userAgent, false)

    const sessionPayload = await this.createTokens(session)

    await this.sessionRepository.save(session)

    return sessionPayload
  }

  async createNewEphemeralSessionForUser(user: User, apiVersion: string, userAgent: string): Promise<SessionBody> {
    const ephemeralSession = this.createSession(user, apiVersion, userAgent, true)

    const sessionPayload = await this.createTokens(ephemeralSession)

    await this.ephemeralSessionRepository.save(ephemeralSession)

    return sessionPayload
  }

  async refreshTokens(session: Session): Promise<SessionBody> {
    const sessionPayload = await this.createTokens(session)

    await this.sessionRepository.updateHashedTokens(session.uuid, session.hashedAccessToken, session.hashedRefreshToken)

    await this.sessionRepository.updatedTokenExpirationDates(session.uuid, session.accessExpiration, session.refreshExpiration)

    await this.ephemeralSessionRepository.updateTokensAndExpirationDates(
      session.uuid,
      session.hashedAccessToken,
      session.hashedRefreshToken,
      session.accessExpiration,
      session.refreshExpiration
    )

    return sessionPayload
  }

  isRefreshTokenValid(session: Session, token: string): boolean {
    const tokenParts = token.split(':')
    const refreshToken = tokenParts[2]
    if (!refreshToken) {
      return false
    }

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(hashedRefreshToken), Buffer.from(session.hashedRefreshToken))
  }

  getOperatingSystemInfoFromUserAgent(userAgent: string): string {
    try {
      const userAgentParsed = this.deviceDetector.setUA(userAgent).getResult()

      const osInfo = `${userAgentParsed.os.name ?? ''} ${userAgentParsed.os.version ?? ''}`.trim()

      if (userAgentParsed.ua.toLowerCase().indexOf('okhttp') >= 0) {
        return 'Android'
      }

      return osInfo
    }
    catch (error) {
      this.logger.warning(`Could not parse operating system info. User agent: ${userAgent}: ${error.message}`)

      return 'Unknown OS'
    }
  }

  getBrowserInfoFromUserAgent(userAgent: string): string {
    try {
      const userAgentParsed = this.deviceDetector.setUA(userAgent).getResult()

      let clientInfo = `${userAgentParsed.browser.name ?? ''} ${userAgentParsed.browser.version ?? ''}`.trim()

      const desktopAppMatches = [...userAgentParsed.ua.matchAll(/(.*)StandardNotes\/((0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*))/g)]
      if (desktopAppMatches[0] && desktopAppMatches[0][2]) {
        clientInfo = `Standard Notes Desktop ${desktopAppMatches[0][2]}`
      }

      return clientInfo
    }
    catch (error) {
      this.logger.warning(`Could not parse browser info. User agent: ${userAgent}: ${error.message}`)

      return 'Unknown Client'
    }
  }

  getDeviceInfo(session: Session): string {
    const browserInfo = this.getBrowserInfoFromUserAgent(session.userAgent)
    const osInfo = this.getOperatingSystemInfoFromUserAgent(session.userAgent)

    if (osInfo && !browserInfo) {
      return osInfo
    }

    if (browserInfo && !osInfo) {
      return browserInfo
    }

    if (!browserInfo && !osInfo) {
      return 'Unknown Client on Unknown OS'
    }

    return `${browserInfo} on ${osInfo}`
  }

  async getSessionFromToken(token: string): Promise<Session | undefined> {
    const tokenParts = token.split(':')
    const sessionUuid = tokenParts[1]
    const accessToken = tokenParts[2]
    if (!accessToken) {
      return undefined
    }

    const session = await this.getSession(sessionUuid)
    if (!session) {
      return undefined
    }

    const hashedAccessToken = crypto.createHash('sha256').update(accessToken).digest('hex')
    if(crypto.timingSafeEqual(Buffer.from(session.hashedAccessToken), Buffer.from(hashedAccessToken))) {
      return session
    }

    return undefined
  }

  async getRevokedSessionFromToken(token: string): Promise<RevokedSession | undefined> {
    const tokenParts = token.split(':')
    const sessionUuid = tokenParts[1]
    if (!sessionUuid) {
      return undefined
    }

    return this.revokedSessionRepository.findOneByUuid(sessionUuid)
  }

  async markRevokedSessionAsReceived(revokedSession: RevokedSession): Promise<RevokedSession> {
    revokedSession.received = true

    return this.revokedSessionRepository.save(revokedSession)
  }

  async deleteSessionByToken(token: string): Promise<void> {
    const session = await this.getSessionFromToken(token)

    if (session) {
      await this.sessionRepository.deleteOneByUuid(session.uuid)
      await this.ephemeralSessionRepository.deleteOne(session.uuid, session.userUuid)
    }
  }

  async createRevokedSession(session: Session): Promise<RevokedSession> {
    const revokedSession = new RevokedSession()
    revokedSession.uuid = session.uuid
    revokedSession.userUuid = session.userUuid
    revokedSession.createdAt = dayjs.utc().toDate()

    return this.revokedSessionRepository.save(revokedSession)
  }

  private createSession(user: User, apiVersion: string, userAgent: string, ephemeral: boolean): Session {
    let session = new Session()
    if (ephemeral) {
      session = new EphemeralSession()
    }
    session.uuid = uuidv4()
    session.userUuid = user.uuid
    session.apiVersion = apiVersion
    session.userAgent = userAgent
    session.createdAt = dayjs.utc().toDate()
    session.updatedAt = dayjs.utc().toDate()

    return session
  }

  private async getSession(uuid: string): Promise<Session | undefined> {
    let session = await this.ephemeralSessionRepository.findOneByUuid(uuid)

    if (!session) {
      session = await this.sessionRepository.findOneByUuid(uuid)
    }

    return session
  }

  private async createTokens(session: Session): Promise<SessionBody> {
    const accessToken = cryptoRandomString({ length: 16, type: 'url-safe' })
    const refreshToken = cryptoRandomString({ length: 16, type: 'url-safe' })

    const hashedAccessToken = crypto.createHash('sha256').update(accessToken).digest('hex')
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex')
    session.hashedAccessToken = hashedAccessToken
    session.hashedRefreshToken = hashedRefreshToken

    const accessTokenExpiration = dayjs.utc().add(this.accessTokenAge, 'second').toDate()
    const refreshTokenExpiration = dayjs.utc().add(this.refreshTokenAge, 'second').toDate()
    session.accessExpiration = accessTokenExpiration
    session.refreshExpiration = refreshTokenExpiration

    return {
      access_token: `${SessionService.SESSION_TOKEN_VERSION}:${session.uuid}:${accessToken}`,
      refresh_token: `${SessionService.SESSION_TOKEN_VERSION}:${session.uuid}:${refreshToken}`,
      access_expiration: this.timer.convertStringDateToMilliseconds(accessTokenExpiration.toString()),
      refresh_expiration: this.timer.convertStringDateToMilliseconds(refreshTokenExpiration.toString()),
      readonly_access: false,
    }
  }
}
