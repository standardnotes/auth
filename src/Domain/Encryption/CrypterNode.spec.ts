import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { User } from '../User/User'
import { CrypterNode } from './CrypterNode'

describe('CrypterNode', () => {
  let crypto: SnCryptoNode
  const encryptionServerKey = 'secret-key'
  let user: User

  const createCrypter = () => new CrypterNode(encryptionServerKey, crypto)

  beforeEach(() => {
    crypto = {} as jest.Mocked<SnCryptoNode>
    crypto.aes256GcmEncrypt = jest.fn().mockReturnValue('encrypted-test')
    crypto.aes256GcmDecrypt = jest.fn().mockReturnValue('decrypted-test')
    crypto.generateRandomKey = jest.fn().mockReturnValue('random-nonce')

    user = {} as jest.Mocked<User>
    user.encryptedServerKey = '1:"my-secret-key"'
  })

  it('should encrypt a value for user', async () => {
    expect(await createCrypter().encryptForUser('test', user)).toEqual('1:"encrypted-test"')

    expect(crypto.aes256GcmDecrypt).toHaveBeenCalledWith('my-secret-key', 'secret-key')

    expect(crypto.aes256GcmEncrypt).toHaveBeenCalledWith({ unencrypted: 'test', iv: 'random-nonce', key: 'decrypted-test' })
  })

  it('should decrypt a value for user', async () => {
    expect(await createCrypter().decryptForUser('1:"test"', user)).toEqual('decrypted-test')

    expect(crypto.aes256GcmDecrypt).toHaveBeenNthCalledWith(1, 'my-secret-key', 'secret-key')

    expect(crypto.aes256GcmDecrypt).toHaveBeenNthCalledWith(2, 'test', 'decrypted-test')
  })

  it('should generate an encrypted server key', async () => {
    crypto.generateRandomKey = jest.fn()
      .mockReturnValueOnce('server-key')
      .mockReturnValueOnce('random-nonce')

    expect(await createCrypter().generateEncryptedUserServerKey()).toEqual('1:"encrypted-test"')

    expect(crypto.aes256GcmEncrypt).toHaveBeenCalledWith({ unencrypted: 'server-key', iv: 'random-nonce', key: 'secret-key' })
  })

  it('should decrypt a user server key', async () => {
    expect(await createCrypter().decryptUserServerKey(user)).toEqual('decrypted-test')

    expect(crypto.aes256GcmDecrypt).toHaveBeenCalledWith('my-secret-key', 'secret-key')
  })

  it('should throw an error if the user server key is encrypted with unsupported version', async () => {
    let error = null
    user.encryptedServerKey = '2:my-secret-key:my-nonce'
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
      await createCrypter().decryptForUser('2:test:some-nonce', user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })

  it('should throw an error if the user server key is encrypted with unsupported version', async () => {
    let error = null
    user.encryptedServerKey = '2:my-secret-key:my-nonce'
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
