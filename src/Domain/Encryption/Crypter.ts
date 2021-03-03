import { inject, injectable } from 'inversify'
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto'

import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from './CrypterInterface'

@injectable()
export class Crypter implements CrypterInterface {
  static readonly ENCRYPTION_VERSION_1 = 1

  private readonly ENCRYPTION_KEY_LENGTH = 32

  constructor(
    @inject(TYPES.ENCRYPTION_ITERATIONS) private encryptionIterations: number
  ) {
  }

  async encrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string> {
    if (encryptionVersion !== Crypter.ENCRYPTION_VERSION_1) {
      throw new Error(`Supported versions of encryption: ${Crypter.ENCRYPTION_VERSION_1}`)
    }

    const iv = randomBytes(16)

    const salt = randomBytes(64)

    const key = pbkdf2Sync(masterKey, salt, this.encryptionIterations, this.ENCRYPTION_KEY_LENGTH, 'sha512')

    const cipher = createCipheriv('aes-256-gcm', key, iv)

    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])

    const tag = cipher.getAuthTag()

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
  }

  async decrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string> {
    if (encryptionVersion !== Crypter.ENCRYPTION_VERSION_1) {
      throw new Error(`Supported versions of encryption: ${Crypter.ENCRYPTION_VERSION_1}`)
    }

    const bData = Buffer.from(data, 'base64')

    const salt = bData.slice(0, 64)
    const iv = bData.slice(64, 80)
    const tag = bData.slice(80, 96)
    const text = bData.slice(96)

    const key = pbkdf2Sync(masterKey, salt , this.encryptionIterations, this.ENCRYPTION_KEY_LENGTH, 'sha512')

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    const decrypted = decipher.update(text, undefined, 'utf8') + decipher.final('utf8')

    return decrypted
  }
}
