import 'reflect-metadata'
import { authenticator } from 'otplib'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { ErrorTag, MfaSetting } from '@standardnotes/auth'

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
    crypter.decryptForUser = jest.fn()
  })

  it('should pass MFA verification if user has no MFA enabled', async () => {
    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: '' })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification if user is not found', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)
    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: '' })).toEqual({
      success: true,
    })
  })

  it('should not pass MFA verification if mfa param is not found in the request', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: MfaSetting.MfaSecret,
      value: '1:shhhh:qwerty',
    })

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: '' })).toEqual({
      success: false,
      errorTag: ErrorTag.MfaRequired,
      errorMessage: 'Please enter your two-factor authentication code.',
    })
  })

  it('should not pass MFA verification if mfa is not correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: MfaSetting.MfaSecret,
      value: '1:zzqwrq:qwerty',
    })

    crypter.decryptForUser = jest.fn().mockReturnValue('shhhh')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: 'invalid-token' })).toEqual({
      success: false,
      errorTag: ErrorTag.MfaInvalid,
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.',
    })
  })

  it('should pass MFA verification if mfa key is correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({
      name: MfaSetting.MfaSecret,
      value: '1:shhhh:qwerty',
    })

    crypter.decryptForUser = jest.fn().mockReturnValue('test')

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: authenticator.generate('test') })).toEqual({
      success: true,
    })
  })
})
