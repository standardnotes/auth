import { SessionBody } from '@standardnotes/responses'
import { User } from '../User/User'
import { RevokedSession } from './RevokedSession'
import { Session } from './Session'

export interface SessionServiceInterface {
  createNewSessionForUser(user: User, apiVersion: string, userAgent: string): Promise<SessionBody>
  createNewEphemeralSessionForUser(user: User, apiVersion: string, userAgent: string): Promise<SessionBody>
  refreshTokens(session: Session): Promise<SessionBody>
  getSessionFromToken(token: string): Promise<Session | undefined>
  getRevokedSessionFromToken(token: string): Promise<RevokedSession | undefined>
  markRevokedSessionAsReceived(revokedSession: RevokedSession): Promise<RevokedSession>
  deleteSessionByToken(token: string): Promise<void>
  isRefreshTokenValid(session: Session, token: string): boolean
  getDeviceInfo(session: Session): string
  getOperatingSystemInfoFromUserAgent(userAgent: string): string
  getBrowserInfoFromUserAgent(userAgent: string): string
  createRevokedSession(session: Session): Promise<RevokedSession>
}
