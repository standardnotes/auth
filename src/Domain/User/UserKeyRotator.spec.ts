import 'reflect-metadata'

import { User } from './User'
import { UserKeyRotator } from './UserKeyRotator'
import { UserRepositoryInterface } from './UserRepositoryInterface'
import { SNPureCrypto } from '@standardnotes/sncrypto-common'

describe('UserKeyRotator', () => {
  let crypter: SNPureCrypto
  let userRepository: UserRepositoryInterface
  const encryptionServerKey = 'secret-key'

  const createRotator = () => new UserKeyRotator(crypter, userRepository, encryptionServerKey)

  beforeEach(() => {
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()

    crypter = {} as jest.Mocked<SNPureCrypto>
    crypter.xchacha20Encrypt = jest.fn().mockReturnValue('test')
    crypter.generateRandomKey = jest.fn().mockReturnValue('test-key')
  })

  it('should rotate the user server key', async () => {
    const user = {} as jest.Mocked<User>

    await createRotator().rotateServerKey(user)

    expect(userRepository.save).toHaveBeenCalledWith({
      encryptedServerKey: '1:test:test-key',
      encryptionVersion: 1
    })
  })
})
