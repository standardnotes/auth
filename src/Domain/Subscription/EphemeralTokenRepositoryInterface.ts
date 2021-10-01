import { Uuid } from '@standardnotes/common'
import { EphemeralToken } from './EphemeralToken'

export interface EphemeralTokenRepositoryInterface {
  save(ephemeralToken: EphemeralToken): Promise<void>
  getUserUuidByToken(token: string): Promise<Uuid | undefined>
}
