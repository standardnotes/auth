import { User } from '../../User/User'

export type AuthenticateTokenResponse = {
  success: boolean,
  user?: User,
}
