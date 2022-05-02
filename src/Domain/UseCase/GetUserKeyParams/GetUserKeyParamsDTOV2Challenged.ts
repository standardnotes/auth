import { User } from '../../User/User'

export type GetUserKeyParamsDTOV2Challenged = {
  authenticated: boolean
  codeChallenge: string
  email?: string
  userUuid?: string
  authenticatedUser?: User
}
