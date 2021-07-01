import { Aes256GcmEncrypted } from '@standardnotes/sncrypto-common'
import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { CrypterNode } from './CrypterNode'

describe('CrypterNode', () => {
  let crypto: SnCryptoNode
  let user: User
  let userRepository: UserRepositoryInterface

  const iv = 'iv'

  const createCrypter = () => new CrypterNode(serverKey, crypto, userRepository)

  const makeEncrypted = (ciphertext: string): Aes256GcmEncrypted<string> => {
    return {
      iv,
      tag: 'tag',
      ciphertext,
      encoding: 'encoding',
      aad: '',
    }
  }

  const version = (encrypted: Aes256GcmEncrypted<string>, v = 1) => {
    return JSON.stringify({
      version: v,
      encrypted,
    })
  }

  const unencrypted = 'unencrypted'
  const decrypted = 'decrypted'
  const encryptedUserKey = makeEncrypted('encryptedUserKey')
  const serverKey = '7365727665724b65792e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e'
  const unsupportedVersion = 999999
  const encrypted = makeEncrypted('encrypted')

  beforeEach(() => {
    crypto = {} as jest.Mocked<SnCryptoNode>
    crypto.aes256GcmEncrypt = jest.fn().mockReturnValue(encrypted)
    crypto.aes256GcmDecrypt = jest.fn().mockReturnValue(decrypted)
    crypto.generateRandomKey = jest.fn().mockReturnValue(iv)

    user = {} as jest.Mocked<User>
    user.encryptedServerKey = version(encryptedUserKey)

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()
  })

  it('should fail to instantiate on non-32-byte key', async () => {
    expect(() => new CrypterNode('short-key', crypto, userRepository)).toThrow()
  })

  it('should encrypt a value for user', async () => {
    expect(await createCrypter().encryptForUser(unencrypted, user))
      .toEqual(version(encrypted))

    expect(crypto.aes256GcmDecrypt).toHaveBeenCalledWith(
      encryptedUserKey,
      serverKey,
    )

    expect(crypto.aes256GcmEncrypt).toHaveBeenCalledWith({ unencrypted, iv, key: decrypted })
  })

  it('should decrypt a value for user', async () => {
    expect(await createCrypter().decryptForUser(version(encrypted), user)).toEqual(decrypted)

    expect(crypto.aes256GcmDecrypt).toHaveBeenNthCalledWith(1, encryptedUserKey, serverKey)

    expect(crypto.aes256GcmDecrypt).toHaveBeenNthCalledWith(2, encrypted, decrypted)
  })

  it('should generate an encrypted server key for user during decryption if one does not exist', async () => {
    user.encryptedServerKey = null
    user.serverEncryptionVersion = 0

    expect(await createCrypter().decryptForUser(version(encrypted), user)).toEqual(decrypted)

    expect(crypto.aes256GcmDecrypt).toHaveBeenCalledTimes(2)

    expect(userRepository.save).toHaveBeenCalled()
  })

  it('should generate an encrypted user server key', async () => {
    const anotherUserKey = 'anotherUserKey'
    crypto.generateRandomKey = jest.fn()
      .mockReturnValueOnce(anotherUserKey)
      .mockReturnValueOnce(iv)

    expect(await createCrypter().generateEncryptedUserServerKey())
      .toEqual(version(encrypted))

    expect(crypto.aes256GcmEncrypt).toHaveBeenCalledWith({
      unencrypted: anotherUserKey,
      iv,
      key: serverKey,
    })
  })

  it('should decrypt a user server key', async () => {
    expect(await createCrypter().decryptUserServerKey(user)).toEqual(decrypted)

    expect(crypto.aes256GcmDecrypt).toHaveBeenCalledWith(encryptedUserKey, serverKey)
  })

  it('should throw an error if the user server key is encrypted with unsupported version', async () => {
    let error = null
    user.encryptedServerKey = version(encryptedUserKey, unsupportedVersion)
    try {
      await createCrypter().decryptUserServerKey(user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })

  it('should throw an error if the value is encrypted with unsupported version', async () => {
    let error = null
    try {
      await createCrypter().decryptForUser(version(encrypted, unsupportedVersion), user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })

  it('should throw an error if the user server key is encrypted with unsupported version', async () => {
    let error = null
    user.encryptedServerKey = version(encryptedUserKey, unsupportedVersion)
    try {
      await createCrypter().decryptUserServerKey(user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })

  it('should throw an error if the user server key failed to decrypt', async () => {
    let error = null
    crypto.aes256GcmDecrypt = jest.fn().mockImplementation(() => {
      throw Error('encryption error')
    })
    try {
      await createCrypter().decryptUserServerKey(user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })
})
