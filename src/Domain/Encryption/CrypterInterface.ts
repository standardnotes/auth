import { User } from '../User/User'

export interface CrypterInterface {
  encryptForUser(value: string, user: User): Promise<string>
  decryptForUser(value: string, user: User): Promise<string>
  generateEncryptedUserServerKey(): Promise<string>
  decryptUserServerKey(user: User): Promise<string>
}
