import { User } from '../../User/User'

export type GetUserKeyParamsDTO = {
  email?: string
  userUuid?: string
  authenticatedUser?: User
}
