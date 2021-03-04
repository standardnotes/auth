import { randomBytes } from 'crypto'
import { injectable } from 'inversify'

import { RandomStringGeneratorInterface } from './RandomStringGeneratorInterface'

@injectable()
export class RandomStringGenerator implements RandomStringGeneratorInterface {
  generateUrlSafe(length: number): string {
    const randomString = this.generate(length)

    return randomString.replace(/[^a-zA-Z0-9-._~]/gi, '_')
  }

  generate(length: number): string {
    return randomBytes(length).toString('base64').slice(0, length)
  }
}
