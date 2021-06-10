import 'reflect-metadata'
import { authenticator } from 'otplib'

import { ContentDecoderInterface } from '../Item/ContentDecoderInterface'
import { Item } from '../Item/Item'
import { ItemRepositoryInterface } from '../Item/ItemRepositoryInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { VerifyMFA } from './VerifyMFA'
import { SettingRepositoryInterface } from '../Setting/SettingRepositoryInterface'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { Setting } from '../Setting/Setting'

describe('VerifyMFA', () => {
  let user: User
  let item: Item
  let userRepository: UserRepositoryInterface
  let itemRepository: ItemRepositoryInterface
  let contentDecoder: ContentDecoderInterface
  let settingRepository: SettingRepositoryInterface
  let crypter: CrypterInterface

  const createVerifyMFA = () => new VerifyMFA(
    userRepository,
    itemRepository,
    settingRepository,
    crypter,
    contentDecoder
  )

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    item = {} as jest.Mocked<Item>
    item.uuid = '1-2-3'
    item.content = 'test-data'

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    itemRepository = {} as jest.Mocked<ItemRepositoryInterface>
    itemRepository.findMFAExtensionByUserUuid = jest.fn().mockReturnValue(undefined)

    contentDecoder = {} as jest.Mocked<ContentDecoderInterface>
    contentDecoder.decode = jest.fn().mockReturnValue({})

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByNameAndUserUuid = jest.fn()

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.decryptForUser = jest.fn()
  })

  it('should pass MFA verification if user has no MFA enabled', async () => {
    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: {} })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification if user has MFA deleted', async () => {
    item.deleted = true
    itemRepository.findMFAExtensionByUserUuid = jest.fn().mockReturnValue(item)

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
    itemRepository.findMFAExtensionByUserUuid = jest.fn().mockReturnValue(item)

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: {} })).toEqual({
      success: false,
      errorTag: 'mfa-required',
      errorMessage: 'Please enter your two-factor authentication code.',
      errorPayload: { mfa_key: 'mfa_1-2-3' },
    })
  })

  it('should not pass MFA verification if mfa is not correct', async () => {
    contentDecoder.decode = jest.fn().mockReturnValue({
      secret: 'shhhh',
    })
    itemRepository.findMFAExtensionByUserUuid = jest.fn().mockReturnValue(item)

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': 'test' } })).toEqual({
      success: false,
      errorTag: 'mfa-invalid',
      errorMessage: 'The two-factor authentication code you entered is incorrect. Please try again.',
      errorPayload: { mfa_key: 'mfa_1-2-3' },
    })
  })

  it('should pass MFA verification if mfa key is correct', async () => {
    contentDecoder.decode = jest.fn().mockReturnValue({
      secret: 'shhhh',
    })

    itemRepository.findMFAExtensionByUserUuid = jest.fn().mockReturnValue(item)

    expect(await createVerifyMFA().execute({ email: 'test@test.te', requestParams: { 'mfa_1-2-3': authenticator.generate('shhhh') } })).toEqual({
      success: true,
    })
  })

  it('should pass MFA verification from user settings if mfa key is correct', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue({} as jest.Mocked<Setting>)

    crypter.decryptForUser = jest.fn().mockReturnValue('shhhh')

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
