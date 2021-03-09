import 'reflect-metadata'
import { authenticator } from 'otplib'
import { SNPureCrypto } from '@standardnotes/sncrypto-common'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../Setting/Settings'
import { UserServerKeyDecrypterInterface } from '../User/UserServerKeyDecrypterInterface'

describe('VerifyMFA', () => {
  let user: User
  let userRepository: UserRepositoryInterface
  let crypter: SNPureCrypto
  let settingRepository: SettingRepositoryInterface
  let userServerKeyDecrypter: UserServerKeyDecrypterInterface

  const createVerifyMFA = () => new VerifyMFA(userRepository, settingRepository, crypter, userServerKeyDecrypter)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(null)

    crypter = {} as jest.Mocked<SNPureCrypto>
    crypter.xchacha20Decrypt = jest.fn()

    userServerKeyDecrypter = {} as jest.Mocked<UserServerKeyDecrypterInterface>
    userServerKeyDecrypter.decrypt = jest.fn().mockReturnValue('test')
  })

  it('should pass MFA verification if user has no MFA enabled', async () => {
    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: '' })).toEqual({
      success: true
    })
  })

  it('should not pass MFA verification if user is not found', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(null)
    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: '' })).toEqual({
      success: false,
      errorMessage: 'Invalid email or password'
    })
  })

  it('should not pass MFA verification if mfa param is not found in the request', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SETTINGS.MFA_SECRET,
      value: '1:shhhh:qwerty'
    })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: '' })).toEqual({
      success: false,
      errorTag: 'mfa-required',
      errorMessage: 'Please enter your two-factor authentication code.',
    })
  })

  it('should not pass MFA verification if mfa is not correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SETTINGS.MFA_SECRET,
      value: '1:shhhh:qwerty'
    })

    crypter.xchacha20Decrypt = jest.fn().mockReturnValue('test')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: 'invalid-token' })).toEqual({
      success: false,
      errorTag: 'mfa-invalid',
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.'
    })
  })

  it('should not pass MFA verification if encryption version is incorrect', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SETTINGS.MFA_SECRET,
      value: '2:shhhh:qwerty'
    })

    crypter.xchacha20Decrypt = jest.fn().mockReturnValue('test')

    let error = null
    try {
      await createVerifyMFA().execute({ email: 'test@test.te', token: 'invalid-token' })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
  })

  it('should pass MFA verification if mfa key is correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SETTINGS.MFA_SECRET,
      value: '1:shhhh:qwerty'
    })

    crypter.xchacha20Decrypt = jest.fn().mockReturnValue('test')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: authenticator.generate('test') })).toEqual({
      success: true,
    })
  })
})
