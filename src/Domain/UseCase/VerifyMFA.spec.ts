import 'reflect-metadata'
import { authenticator } from 'otplib'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { Setting } from '../Setting/Setting'
import { ItemHttpServiceInterface } from '../Item/ItemHttpServiceInterface'
import { Logger } from 'winston'

describe('VerifyMFA', () => {
  let user: User
  let userRepository: UserRepositoryInterface
  let settingRepository: SettingRepositoryInterface
  let itemHttpService: ItemHttpServiceInterface
  let crypter: CrypterInterface
  let logger: Logger

  const createVerifyMFA = () => new VerifyMFA(
    userRepository,
    itemHttpService,
    settingRepository,
    crypter,
    logger
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    itemHttpService = {} as jest.Mocked<ItemHttpServiceInterface>
    itemHttpService.getUserMFASecret = jest.fn().mockReturnValue(undefined)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByNameAndUserUuid = jest.fn()

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

  it('should not pass MFA verification if mfa param is not found in the request', async () => {
    itemHttpService.getUserMFASecret = jest.fn().mockReturnValue({
      secret: 'shhhh',
      extensionUuid: '1-2-3',
    })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: {} })).toEqual({
      success: false,
      errorTag: 'mfa-required',
      errorMessage: 'Please enter your two-factor authentication code.',
      errorPayload: { mfa_key: 'mfa_1-2-3' },
    })
  })

  it('should not pass MFA verification if mfa is not correct', async () => {
    itemHttpService.getUserMFASecret = jest.fn().mockReturnValue({
      secret: 'shhhh',
      extensionUuid: '1-2-3',
    })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': 'test' } })).toEqual({
      success: false,
      errorTag: 'mfa-invalid',
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.',
      errorPayload: { mfa_key: 'mfa_1-2-3' },
    })
  })

  it('should pass MFA verification if mfa key is correct', async () => {
    itemHttpService.getUserMFASecret = jest.fn().mockReturnValue({
      secret: 'shhhh',
      extensionUuid: '1-2-3',
    })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification from user settings if mfa key is correctly encrypted', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: 1,
    } as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('shhhh')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification from user settings if mfa key is correctly unencrypted', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      serverEncryptionVersion: 0,
      value: 'shhhh',
    } as jest.Mocked<Setting>)

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should not pass MFA verification from user settings if mfa is not correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({} as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('shhhh')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': 'test' } })).toEqual({
      success: false,
      errorTag: 'mfa-invalid',
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.',
      errorPayload: { mfa_key: 'mfa_1-2-3' },
    })
  })


  it('should not pass MFA verification from user settings if no mfa param is found in the request', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({} as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('shhhh')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'foo': 'bar' } })).toEqual({
      success: false,
      errorTag: 'mfa-required',
      errorMessage: 'Please enter your two-factor authentication code.',
      errorPayload: { mfa_key: expect.stringMatching(/^mfa_/) },
    })
  })

  it('should throw an error if the error is not handled mfa validation error', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockImplementation(() => {
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
