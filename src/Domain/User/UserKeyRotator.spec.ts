import 'reflect-metadata'

import { randomBytes } from 'crypto'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { RandomStringGeneratorInterface } from '../Encryption/RandomStringGeneratorInterface'
import { User } from './User'
import { UserKeyRotator } from './UserKeyRotator'
import { UserRepositoryInterface } from './UserRepositoryInterface'

describe('UserKeyRotator', () => {
  let crypter: CrypterInterface
  let userRepository: UserRepositoryInterface
  let randomStringGenerator: RandomStringGeneratorInterface
  const encryptionServerKey = 'secret-key'

  const createRotator = () => new UserKeyRotator(crypter, userRepository, randomStringGenerator, encryptionServerKey)

  beforeEach(() => {
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()

    randomStringGenerator = {} as jest.Mocked<RandomStringGeneratorInterface>
    randomStringGenerator.generate = jest.fn().mockImplementation(length => randomBytes(length).toString('base64').slice(0, length))

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.encrypt = jest.fn().mockReturnValue('test')
  })

  it('should rotate the user server key', async () => {
    const user = {} as jest.Mocked<User>

    await createRotator().rotateServerKey(user)

    expect(userRepository.save).toHaveBeenCalledWith({
      encryptedServerKey: 'test'
    })
  })
})
