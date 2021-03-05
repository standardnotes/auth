import { inject, injectable } from 'inversify'
import { SNPureCrypto } from '@standardnotes/sncrypto-common'

import TYPES from '../../Bootstrap/Types'
import { User } from './User'
import { UserKeyRotatorInterface } from './UserKeyRotatorInterface'
import { UserRepositoryInterface } from './UserRepositoryInterface'

@injectable()
export class UserKeyRotator implements UserKeyRotatorInterface {
  constructor(
    @inject(TYPES.Crypter) private crypter: SNPureCrypto,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string
  ) {
  }

  async rotateServerKey(user: User): Promise<void> {
    const unencryptedServerKey = await this.crypter.generateRandomKey(32)
    const nonce = await this.crypter.generateRandomKey(16)

    user.encryptedServerKey = await this.crypter.xchacha20Encrypt(
      unencryptedServerKey,
      nonce,
      this.encryptionServerKey,
      ''
    )
    user.serverKeyNonce = nonce

    await this.userRepository.save(user)
  }
}
