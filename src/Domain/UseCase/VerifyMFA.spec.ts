import 'reflect-metadata'
import { authenticator } from 'otplib'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../Setting/Settings'
import { CrypterInterface } from '../Encryption/CrypterInterface'

describe('VerifyMFA', () => {
  let user: User
  let userRepository: UserRepositoryInterface
  let crypter: CrypterInterface
  let settingRepository: SettingRepositoryInterface

  const createVerifyMFA = () => new VerifyMFA(userRepository, settingRepository, crypter)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(null)

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decrypt = jest.fn()
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
      value: 'shhhh'
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
      value: 'shhhh'
    })

    crypter.decrypt = jest.fn().mockReturnValue('test')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: 'invalid-token' })).toEqual({
      success: false,
      errorTag: 'mfa-invalid',
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.'
    })
  })

  it('should pass MFA verification if mfa key is correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: SETTINGS.MFA_SECRET,
      value: 'shhhh'
    })

    crypter.decrypt = jest.fn().mockReturnValue('test')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: authenticator.generate('test') })).toEqual({
      success: true,
    })
  })
})
