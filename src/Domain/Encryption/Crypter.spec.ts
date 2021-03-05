import 'reflect-metadata'

import { randomBytes } from 'crypto'

import { Crypter } from './Crypter'
import { RandomStringGeneratorInterface } from './RandomStringGeneratorInterface'

describe('Crypter', () => {
  let randomStringGenerator: RandomStringGeneratorInterface

  const userServerKey = randomBytes(32).toString('base64').slice(0, 32)

  const createCrypter = () => new Crypter(randomStringGenerator)

  beforeEach(() => {
    randomStringGenerator = {} as jest.Mocked<RandomStringGeneratorInterface>
    randomStringGenerator.generate = jest.fn().mockImplementation(length => randomBytes(length).toString('base64').slice(0, length))
  })

  it('should encrypt and decrypt data', async () => {
    const sampleData = 'My-Super-Secret-Data'

    const encryptedSampleData = await createCrypter().encrypt(Crypter.ENCRYPTION_VERSION_1, sampleData, userServerKey)

    expect(encryptedSampleData).toHaveLength(135)

    expect(
      await createCrypter().decrypt(Crypter.ENCRYPTION_VERSION_1, encryptedSampleData, userServerKey)
    ).toEqual('My-Super-Secret-Data')
  })

  it('should encrypt same data with different output every time', async () => {
    const sampleData = 'My-Super-Secret-Data'

    const encryptedSampleData1 = await createCrypter().encrypt(Crypter.ENCRYPTION_VERSION_1, sampleData, userServerKey)

    const encryptedSampleData2 = await createCrypter().encrypt(Crypter.ENCRYPTION_VERSION_1, sampleData, userServerKey)

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
