import { EphemeralToken } from './EphemeralToken'

export interface EphemeralTokenRepositoryInterface {
  save(ephemeralToken: EphemeralToken): Promise<void>
}
