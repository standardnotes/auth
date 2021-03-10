import { SNPureCrypto } from '@standardnotes/sncrypto-common'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { User } from '../User/User'
import { CrypterInterface } from './CrypterInterface'

@injectable()
export class Crypter implements CrypterInterface {
  constructor (
    @inject(TYPES.SNCrypto) private snCrypto: SNPureCrypto,
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string
  ) {
  }

  async encryptForUser(value: string, user: User): Promise<string> {
    const decryptedUserServerKey = await this.decryptUserServerKey(user)
    const nonce = await this.snCrypto.generateRandomKey(192)

    const encryptedValue = <string> await this.snCrypto.xchacha20Encrypt(
      value,
      nonce,
      decryptedUserServerKey,
      ''
    )

    return this.formatEncryptedValue(User.ENCRYPTION_VERSION_1, encryptedValue, nonce)
  }


  async decryptForUser(value: string, user: User): Promise<string | null> {
    const decryptedUserServerKey = await this.decryptUserServerKey(user)

    const [ version, ciphertext, nonce ] = value.split(':')
    if (+version !== User.ENCRYPTION_VERSION_1) {
      throw Error (`Not supported encryption version: ${version}`)
    }

    return this.snCrypto.xchacha20Decrypt(
      ciphertext,
      nonce,
      decryptedUserServerKey,
      ''
    )
  }

  async generateEncryptedUserServerKey(): Promise<string> {
    const unencryptedServerKey = await this.snCrypto.generateRandomKey(256)
    const nonce = await this.snCrypto.generateRandomKey(192)

    const encryptedKey = await this.snCrypto.xchacha20Encrypt(
      unencryptedServerKey,
      nonce,
      this.encryptionServerKey,
      ''
    )

    return this.formatEncryptedValue(User.ENCRYPTION_VERSION_1, encryptedKey, nonce)
  }

  async decryptUserServerKey(user: User): Promise<string> {
    const [ version, ciphertext, nonce ] = (<string> user.encryptedServerKey).split(':')
    if (+version !== User.ENCRYPTION_VERSION_1) {
      throw Error (`Not supported encryption version: ${version}`)
    }

    const decryptedUserServerKey = await this.snCrypto.xchacha20Decrypt(
      ciphertext,
      nonce,
      this.encryptionServerKey,
      ''
    )

    if (!decryptedUserServerKey) {
      throw Error('Could not decrypt user server key')
    }

    return decryptedUserServerKey
  }

  private formatEncryptedValue(version: number, encryptedValue: string, nonce: string): string {
    return [ version, encryptedValue, nonce ].join(':')
  }
}
