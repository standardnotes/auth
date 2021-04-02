import { KeyParams } from '@standardnotes/auth'

import { User } from './User'

export interface KeyParamsFactoryInterface {
  create(user: User, authenticated: boolean): KeyParams
  createPseudoParams(email: string): KeyParams
}
