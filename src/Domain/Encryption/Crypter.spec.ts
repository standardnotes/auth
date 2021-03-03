import 'reflect-metadata'

import * as cryptoRandomString from 'crypto-random-string'

import { Crypter } from './Crypter'

describe('Crypter', () => {
  const userServerKey = cryptoRandomString({ length: 32, type: 'base64' })

  const createCrypter = () => new Crypter()

  it('should encrypt and decrypt data', async () => {
    const sampleData = 'My-Super-Secret-Data'

    const encryptedSampleData = await createCrypter().encrypt(Crypter.ENCRYPTION_VERSION_1, sampleData, userServerKey)

    expect(encryptedSampleData).toHaveLength(156)

    expect(
      await createCrypter().decrypt(Crypter.ENCRYPTION_VERSION_1, encryptedSampleData, userServerKey)
    ).toEqual('My-Super-Secret-Data')
  })

  it('should encrypt same data with different output every time', async () => {
    const sampleData = 'My-Super-Secret-Data'

    const encryptedSampleData1 = await createCrypter().encrypt(Crypter.ENCRYPTION_VERSION_1, sampleData, userServerKey)

    expect(encryptedSampleData1).toHaveLength(156)

    const encryptedSampleData2 = await createCrypter().encrypt(Crypter.ENCRYPTION_VERSION_1, sampleData, userServerKey)

    expect(encryptedSampleData2).toHaveLength(156)

    expect(encryptedSampleData1).not.toEqual(encryptedSampleData2)
  })

  it('should throw error on unsupported encryption version when encrypting', async () => {
    const sampleData = 'My-Super-Secret-Data'

    let error = null
    try {
      await createCrypter().encrypt(2, sampleData, userServerKey)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })

  it('should throw error on unsupported encryption version when decrypting', async () => {
    const sampleData = 'My-Super-Secret-Data'

    let error = null
    try {
      await createCrypter().decrypt(2, sampleData, userServerKey)
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })
})
