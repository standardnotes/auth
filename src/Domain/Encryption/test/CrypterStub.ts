import { User } from '../../User/User'
import { CrypterInterface } from '../CrypterInterface'

export class CrypterStub implements CrypterInterface {
  async encryptForUser(_value: string, _user: User): Promise<string> {
    return 'encrypted'
  }
  async decryptForUser(_value: string, _user: User): Promise<string | null> {
    return 'decrypted'
  }
  async generateEncryptedUserServerKey(): Promise<string> {
    return 'encryptedUserServerKey'
  }
  async decryptUserServerKey(_user: User): Promise<string | null> {
    return 'decryptedUserServerKey'
  }
}
