import { Aes256GcmEncrypted } from '@standardnotes/sncrypto-common'
import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { User } from '../User/User'
import { CrypterInterface } from './CrypterInterface'

@injectable()
export class CrypterNode implements CrypterInterface {
  constructor (
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string,
    // have to exclude from coverage because of https://github.com/istanbuljs/istanbuljs/issues/70
    /* istanbul ignore next */
    private cryptoNode: SnCryptoNode = new SnCryptoNode(),
  ) {
  }

  async encryptForUser(unencrypted: string, user: User): Promise<string> {
    const decryptedUserServerKey = await this.decryptUserServerKey(user)
    const iv = await this.cryptoNode.generateRandomKey(128)

    const encrypted = await this.cryptoNode.aes256GcmEncrypt({
      unencrypted,
      iv,
      key: decryptedUserServerKey,
    })

    return this.stringifyVersionedEncrypted(User.ENCRYPTION_VERSION_1, encrypted)
  }

  async decryptForUser(formattedEncryptedValue: string, user: User): Promise<string | null> {
    const decryptedUserServerKey = await this.decryptUserServerKey(user)

    const encrypted = this.parseVersionedEncrypted(formattedEncryptedValue)

    return this.cryptoNode.aes256GcmDecrypt(encrypted, decryptedUserServerKey)
  }

  async generateEncryptedUserServerKey(): Promise<string> {
    const unencrypted = await this.cryptoNode.generateRandomKey(256)
    const iv = await this.cryptoNode.generateRandomKey(128)

    const encrypted = await this.cryptoNode.aes256GcmEncrypt({
      unencrypted,
      iv,
      key: this.encryptionServerKey,
    })

    return this.stringifyVersionedEncrypted(User.ENCRYPTION_VERSION_1, encrypted)
  }

  async decryptUserServerKey(user: User): Promise<string> {
    const encrypted = this.parseVersionedEncrypted(user.encryptedServerKey as string)

    return this.cryptoNode.aes256GcmDecrypt(encrypted, this.encryptionServerKey)
  }

  private stringifyVersionedEncrypted(
    version: number, 
    encrypted: Aes256GcmEncrypted<BufferEncoding>,
  ): string {
    return [version, JSON.stringify(encrypted)].join(':')
  }

  private parseVersionedEncrypted(
    versionedEncryptedString: string,
  ): Aes256GcmEncrypted<BufferEncoding> {
    const [version, encryptedStringified] = versionedEncryptedString.split(':')
    if (+version !== User.ENCRYPTION_VERSION_1) {
      throw Error (`Not supported encryption version: ${version}`)
    }

    return JSON.parse(encryptedStringified)
  }
}
