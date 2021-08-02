import 'reflect-metadata'
import { authenticator } from 'otplib'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { Setting } from '../Setting/Setting'
import { Logger } from 'winston'
import { ContentDecoderInterface } from '../Encryption/ContentDecoderInterface'

describe('VerifyMFA', () => {
  let user: User
  let userRepository: UserRepositoryInterface
  let settingRepository: SettingRepositoryInterface
  let crypter: CrypterInterface
  let contentDecoder: ContentDecoderInterface
  let logger: Logger

  const createVerifyMFA = () => new VerifyMFA(
    userRepository,
    settingRepository,
    crypter,
    contentDecoder,
    logger
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findLastByNameAndUserUuid = jest.fn()

    contentDecoder = {} as jest.Mocked<ContentDecoderInterface>
    contentDecoder.decode = jest.fn().mockReturnValue('decoded')

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decryptForUser = jest.fn()

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should pass MFA verification if user has no MFA enabled or MFA deleted', async () => {
    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: {} })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification if user is not found', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)
    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: {} })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification if mfa key is correctly encrypted', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    } as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('shhhh')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification if mfa key is correctly encoded and encrypted', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED,
    } as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    contentDecoder.decode = jest.fn().mockReturnValue({ secret: 'shhhh' })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification if mfa key is correctly unencrypted', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      value: 'shhhh',
    } as jest.Mocked<Setting>)

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should not pass MFA verification if mfa is not correct', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    } as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    contentDecoder.decode = jest.fn().mockReturnValue({ secret: 'shhhh' })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': 'test' } })).toEqual({
      success: false,
      errorTag: 'mfa-invalid',
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.',
      errorPayload: { mfa_key: 'mfa_1-2-3' },
    })
  })


  it('should not pass MFA verification if no mfa param is found in the request', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    } as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('decrypted')

    contentDecoder.decode = jest.fn().mockReturnValue({ secret: 'shhhh' })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'foo': 'bar' } })).toEqual({
      success: false,
      errorTag: 'mfa-required',
      errorMessage: 'Please enter your two-factor authentication code.',
      errorPayload: { mfa_key: expect.stringMatching(/^mfa_/) },
    })
  })

  it('should throw an error if the error is not handled mfa validation error', async () => {
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockImplementation(() => {
      throw new Error('oops!')
    })

    let error = null
    try {
      await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': 'test' } })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
