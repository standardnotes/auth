import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from './User'

@injectable()
export class UserServerKeyDecrypter {
  constructor(
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string
  ) {
  }

  async decrypt(user: User): Promise<string> {
    return this.crypter.decrypt(
      user.encryptionVersion,
      <string> user.serverKey,
      this.encryptionServerKey
    )
  }
}
