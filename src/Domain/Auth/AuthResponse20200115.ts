import { KeyParamsData } from '@standardnotes/responses'

import { SessionPayload } from '../Session/SessionPayload'
import { AuthResponse } from './AuthResponse'

export interface AuthResponse20200115 extends AuthResponse {
  session: SessionPayload,
  key_params: KeyParamsData
}
