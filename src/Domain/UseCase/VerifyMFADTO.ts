import { MfaPayload } from '@standardnotes/auth'

export type VerifyMFADTO = {
  email: string
  mfaPayload: MfaPayload
}
