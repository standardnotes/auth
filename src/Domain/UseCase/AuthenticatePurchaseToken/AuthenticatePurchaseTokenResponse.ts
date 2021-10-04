import { User } from '../../User/User'

export type AuthenticatePurchaseTokenResponse = {
  success: boolean,
  user?: User,
}
