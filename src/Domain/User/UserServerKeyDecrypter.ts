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
    const [ version, key, nonce ] = (<string> user.encryptedServerKey).split(':')
    if (+version !== User.ENCRYPTION_VERSION_1) {
      throw Error (`Not supported encryption version: ${version}`)
    }

    return this.crypter.xchacha20Decrypt(
      key,
      nonce,
      this.encryptionServerKey,
      ''
    )
  }
}
