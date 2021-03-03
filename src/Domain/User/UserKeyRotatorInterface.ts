import { User } from './User'

export interface UserKeyRotatorInterface {
  rotateServerKey(user: User): Promise<void>
}
