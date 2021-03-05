import { inject, injectable } from 'inversify'
import { createCipheriv, createDecipheriv } from 'crypto'

import { CrypterInterface } from './CrypterInterface'
import TYPES from '../../Bootstrap/Types'
import { RandomStringGeneratorInterface } from './RandomStringGeneratorInterface'

@injectable()
export class Crypter implements CrypterInterface {
  static readonly ENCRYPTION_VERSION_1 = 1

  private readonly IV_LENGTH = 16
  private readonly SALT_LENGTH = 64

  constructor (
    @inject(TYPES.RandomStringGenerator) private randomStringGenerator: RandomStringGeneratorInterface,
  ) {
  }

  async encrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string> {
    if (encryptionVersion !== Crypter.ENCRYPTION_VERSION_1) {
      throw new Error(`Supported versions of encryption: ${Crypter.ENCRYPTION_VERSION_1}`)
    }

    const iv = this.randomStringGenerator.generate(this.IV_LENGTH)

    const salt = this.randomStringGenerator.generate(this.SALT_LENGTH)

    const cipher = createCipheriv('aes-256-gcm', masterKey, iv)

    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]).toString('base64')

    const tag = cipher.getAuthTag().toString('base64')

    return [salt, iv, tag, encrypted].join(':')
  }

  async decrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string> {
    if (encryptionVersion !== Crypter.ENCRYPTION_VERSION_1) {
      throw new Error(`Supported versions of encryption: ${Crypter.ENCRYPTION_VERSION_1}`)
    }

    const dataParts = data.split(':')
    dataParts.shift()
    const [iv, tag, encrypted] = dataParts

    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv)
    decipher.setAuthTag(Buffer.from(tag, 'base64'))

    const decrypted = decipher.update(Buffer.from(encrypted, 'base64'), undefined, 'utf8') + decipher.final('utf8')

    return decrypted
  }
}
