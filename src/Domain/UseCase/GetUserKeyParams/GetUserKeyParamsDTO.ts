import { User } from '../../User/User'

export type GetUserKeyParamsDTO = {
  email: string
  authenticated: boolean
  authenticatedUser?: User
}
