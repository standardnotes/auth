import { inject, injectable } from 'inversify'
import { randomBytes } from 'crypto'

import TYPES from '../../Bootstrap/Types'
import { Crypter } from '../Encryption/Crypter'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from './User'
import { UserKeyRotatorInterface } from './UserKeyRotatorInterface'
import { UserRepositoryInterface } from './UserRepositoryInterface'

@injectable()
export class UserKeyRotator implements UserKeyRotatorInterface {
  constructor(
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string
  ) {
  }

  async rotateServerKey(user: User): Promise<void> {
    const unencryptedServerKey = randomBytes(32).toString('base64').slice(0, 32)

    user.encryptedServerKey = await this.crypter.encrypt(Crypter.ENCRYPTION_VERSION_1, unencryptedServerKey, this.encryptionServerKey)

    await this.userRepository.save(user)
  }
}
