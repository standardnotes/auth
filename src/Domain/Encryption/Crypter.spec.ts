import { SNPureCrypto } from '@standardnotes/sncrypto-common'
import { User } from '../User/User'
import { Crypter } from './Crypter'

describe('Crypter', () => {
  let snCrypto: SNPureCrypto
  const encryptionServerKey = 'secret-key'
  let user: User

  const createCrypter = () => new Crypter(snCrypto, encryptionServerKey)

  beforeEach(() => {
    snCrypto = {} as jest.Mocked<SNPureCrypto>
    snCrypto.xchacha20Decrypt = jest.fn().mockReturnValue('decrypted-test')
    snCrypto.xchacha20Encrypt = jest.fn().mockReturnValue('encrypted-test')
    snCrypto.generateRandomKey = jest.fn().mockReturnValue('random-nonce')

    user = {} as jest.Mocked<User>
    user.encryptedServerKey = '1:my-secret-key:my-nonce'
  })

  it('should encrypt a value for user', async () => {
    expect(await createCrypter().encryptForUser('test', user)).toEqual('1:encrypted-test:random-nonce')

    expect(snCrypto.xchacha20Decrypt).toHaveBeenCalledWith('my-secret-key', 'my-nonce', 'secret-key', '')

    expect(snCrypto.xchacha20Encrypt).toHaveBeenCalledWith('test', 'random-nonce', 'decrypted-test', '')
  })

  it('should decrypt a value for user', async () => {
    expect(await createCrypter().decryptForUser('1:test:some-nonce', user)).toEqual('decrypted-test')

    expect(snCrypto.xchacha20Decrypt).toHaveBeenNthCalledWith(1, 'my-secret-key', 'my-nonce', 'secret-key', '')

    expect(snCrypto.xchacha20Decrypt).toHaveBeenNthCalledWith(2, 'test', 'some-nonce', 'decrypted-test', '')
  })

  it('should generate an encrypted server key', async () => {
    snCrypto.generateRandomKey = jest.fn()
      .mockReturnValueOnce('server-key')
      .mockReturnValueOnce('random-nonce')

    expect(await createCrypter().generateEncryptedUserServerKey()).toEqual('1:encrypted-test:random-nonce')

    expect(snCrypto.xchacha20Encrypt).toHaveBeenCalledWith('server-key', 'random-nonce', 'secret-key', '')
  })

  it('should decrypt a user server key', async () => {
    expect(await createCrypter().decryptUserServerKey(user)).toEqual('decrypted-test')

    expect(snCrypto.xchacha20Decrypt).toHaveBeenCalledWith('my-secret-key', 'my-nonce', 'secret-key', '')
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
    snCrypto.xchacha20Decrypt = jest.fn().mockReturnValue(null)
    try {
      await createCrypter().decryptUserServerKey(user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })
})
