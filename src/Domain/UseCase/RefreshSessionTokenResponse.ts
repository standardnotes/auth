import { SessionBody } from '@standardnotes/responses'

export type RefreshSessionTokenResponse = {
  success: boolean,
  errorTag?: string,
  errorMessage?: string,
  sessionPayload?: SessionBody
}
