import { User } from '../../User/User'

export type GetUserKeyParamsDTO = {
  authenticated: boolean
  email?: string
  userUuid?: string
  authenticatedUser?: User
  codeChallenge?: string
}
