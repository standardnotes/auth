import { User } from './User'

export interface UserServerKeyDecrypterInterface {
  decrypt(user: User): Promise<string | null>
}
