import { inject, injectable } from 'inversify'
import { createCipheriv, createDecipheriv } from 'crypto'

import { CrypterInterface } from './CrypterInterface'
import TYPES from '../../Bootstrap/Types'
import { RandomStringGeneratorInterface } from './RandomStringGeneratorInterface'

@injectable()
export class Crypter implements CrypterInterface {
  static readonly ENCRYPTION_VERSION_1 = 1

  private readonly AES_GCM_AUTH_TAG_LENGTH = 16

  constructor (
    @inject(TYPES.RandomStringGenerator) private randomStringGenerator: RandomStringGeneratorInterface,
    @inject(TYPES.ENCRYPTION_SALT_LENGTH) private encryptionSaltLength: number,
    @inject(TYPES.ENCRYPTION_IV_LENGTH) private encryptionIVLength: number
  ) {
  }

  async encrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string> {
    if (encryptionVersion !== Crypter.ENCRYPTION_VERSION_1) {
      throw new Error(`Supported versions of encryption: ${Crypter.ENCRYPTION_VERSION_1}`)
    }

    const iv = Buffer.from(this.randomStringGenerator.generate(this.encryptionIVLength))

    const salt = Buffer.from(this.randomStringGenerator.generate(this.encryptionSaltLength))

    const cipher = createCipheriv('aes-256-gcm', masterKey, iv)

    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])

    const tag = cipher.getAuthTag()

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
  }

  async decrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string> {
    if (encryptionVersion !== Crypter.ENCRYPTION_VERSION_1) {
      throw new Error(`Supported versions of encryption: ${Crypter.ENCRYPTION_VERSION_1}`)
    }

    const bData = Buffer.from(data, 'base64')

    const saltAndIvLength = this.encryptionSaltLength + this.encryptionIVLength

    const iv = bData.slice(this.encryptionSaltLength, saltAndIvLength)
    const tag = bData.slice(saltAndIvLength, saltAndIvLength + this.AES_GCM_AUTH_TAG_LENGTH)
    const text = bData.slice(saltAndIvLength + this.AES_GCM_AUTH_TAG_LENGTH)

    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv)
    decipher.setAuthTag(tag)

    const decrypted = decipher.update(text, undefined, 'utf8') + decipher.final('utf8')

    return decrypted
  }
}
