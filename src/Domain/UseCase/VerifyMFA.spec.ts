import 'reflect-metadata'
import { authenticator } from 'otplib'

import { ContentDecoderInterface } from '../Item/ContentDecoderInterface'
import { Item } from '../Item/Item'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { SETTINGS } from '../Setting/Settings'

describe('VerifyMFA', () => {
  let user: User
  let item: Item
  let userRepository: UserRepositoryInterface
  let settingRepository: SettingRepositoryInterface
  let contentDecoder: ContentDecoderInterface

  const createVerifyMFA = () => new VerifyMFA(userRepository, settingRepository)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    item = {} as jest.Mocked<Item>
    item.uuid = '1-2-3'

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(null)

    contentDecoder = {} as jest.Mocked<ContentDecoderInterface>
    contentDecoder.decode = jest.fn().mockReturnValue({})
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

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: 'test' })).toEqual({
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

    expect(await createVerifyMFA().execute({ email: 'test@test.te', token: authenticator.generate('shhhh') })).toEqual({
      success: true,
    })
  })
})
