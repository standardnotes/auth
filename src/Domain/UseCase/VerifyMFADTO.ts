export type VerifyMFADTO = {
  email: string
  requestParams: Record<string, unknown>
  source: 'sign-in' | 'auth-params'
}
