import 'reflect-metadata'

import { CrypterInterface } from '../Encryption/CrypterInterface'
import { User } from './User'
import { UserServerKeyDecrypter } from './UserServerKeyDecrypter'

describe('UserServerKeyDecrypter', () => {
  let crypter: CrypterInterface
  const encryptionServerKey = 'secret-key'

  const createDecrypter = () => new UserServerKeyDecrypter(crypter, encryptionServerKey)

  beforeEach(() => {
    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decrypt = jest.fn().mockReturnValue('test')
  })

  it('should decrypt the user server key', async () => {
    const user = {
      serverKey: 'private-key',
      encryptionVersion: 1,
    } as jest.Mocked<User>

    expect(await createDecrypter().decrypt(user)).toEqual('test')

    expect(crypter.decrypt).toHaveBeenCalledWith(1, 'private-key', 'secret-key')
  })
})
