import 'reflect-metadata'

import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from './User'
import { UserKeyRotator } from './UserKeyRotator'
import { UserRepositoryInterface } from './UserRepositoryInterface'

describe('UserKeyRotator', () => {
  let crypter: CrypterInterface
  let userRepository: UserRepositoryInterface
  const encryptionServerKey = 'secret-key'

  const createRotator = () => new UserKeyRotator(crypter, userRepository, encryptionServerKey)

  beforeEach(() => {
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.encrypt = jest.fn().mockReturnValue('test')
  })

  it('should rotate the user server key', async () => {
    const user = {} as jest.Mocked<User>

    await createRotator().rotateServerKey(user)

    expect(userRepository.save).toHaveBeenCalledWith({
      serverKey: 'test'
    })
  })
})
