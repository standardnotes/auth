import 'reflect-metadata'

import { SNPureCrypto } from '@standardnotes/sncrypto-common'
import { User } from './User'
import { UserServerKeyDecrypter } from './UserServerKeyDecrypter'

describe('UserServerKeyDecrypter', () => {
  let crypter: SNPureCrypto
  const encryptionServerKey = 'secret-key'

  const createDecrypter = () => new UserServerKeyDecrypter(crypter, encryptionServerKey)

  beforeEach(() => {
    crypter = {} as jest.Mocked<SNPureCrypto>
    crypter.xchacha20Decrypt = jest.fn().mockReturnValue('test')
  })

  it('should decrypt the user server key', async () => {
    const user = {
      encryptedServerKey: '1:private-key:user-nonce',
      encryptionVersion: 1,
    } as jest.Mocked<User>

    expect(await createDecrypter().decrypt(user)).toEqual('test')

    expect(crypter.xchacha20Decrypt).toHaveBeenCalledWith('private-key', 'user-nonce', 'secret-key', '')
  })

  it('should indicate not supported encryption version of the user server key', async () => {
    const user = {
      encryptedServerKey: '2:private-key:user-nonce',
      encryptionVersion: 2,
    } as jest.Mocked<User>

    let error = null
    try {
      await createDecrypter().decrypt(user)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })
})
