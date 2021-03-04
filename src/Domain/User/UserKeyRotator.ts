import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { Crypter } from '../Encryption/Crypter'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from './User'
import { UserKeyRotatorInterface } from './UserKeyRotatorInterface'
import { UserRepositoryInterface } from './UserRepositoryInterface'
import { RandomStringGeneratorInterface } from '../Encryption/RandomStringGeneratorInterface'

@injectable()
export class UserKeyRotator implements UserKeyRotatorInterface {
  constructor(
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.RandomStringGenerator) private randomStringGenerator: RandomStringGeneratorInterface,
    @inject(TYPES.ENCRYPTION_SERVER_KEY) private encryptionServerKey: string
  ) {
  }

  async rotateServerKey(user: User): Promise<void> {
    const unencryptedServerKey = this.randomStringGenerator.generate(32)

    user.encryptedServerKey = await this.crypter.encrypt(Crypter.ENCRYPTION_VERSION_1, unencryptedServerKey, this.encryptionServerKey)

    await this.userRepository.save(user)
  }
}
