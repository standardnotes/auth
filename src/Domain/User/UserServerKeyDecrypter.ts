import { inject, injectable } from 'inversify'
import { SNPureCrypto } from '@standardnotes/sncrypto-common'
import TYPES from '../../Bootstrap/Types'
import { User } from './User'

@injectable()
export class UserServerKeyDecrypter {
  constructor(
    @inject(TYPES.Crypter) private crypter: SNPureCrypto,
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string
  ) {
  }

  async decrypt(user: User): Promise<string | null> {
    const [ key, nonce ] = (<string> user.encryptedServerKey).split(':')

    return this.crypter.xchacha20Decrypt(
      key,
      nonce,
      this.encryptionServerKey,
      ''
    )
  }
}
