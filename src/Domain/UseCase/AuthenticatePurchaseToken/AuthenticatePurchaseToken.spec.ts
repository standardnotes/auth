import 'reflect-metadata'

import { RoleName } from '@standardnotes/auth'

import { PurchaseTokenRepositoryInterface } from '../../Subscription/PurchaseTokenRepositoryInterface'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'

import { AuthenticatePurchaseToken } from './AuthenticatePurchaseToken'

describe('AuthenticatePurchaseToken', () => {
  let purchaseTokenRepository: PurchaseTokenRepositoryInterface
  let userRepository: UserRepositoryInterface
  let user: User

  const createUseCase = () => new AuthenticatePurchaseToken(purchaseTokenRepository, userRepository)

  beforeEach(() => {
    purchaseTokenRepository = {} as jest.Mocked<PurchaseTokenRepositoryInterface>
    purchaseTokenRepository.getUserUuidByToken = jest.fn().mockReturnValue('1-2-3')

    user = {
      roles: Promise.resolve([{ name: RoleName.CoreUser }]),
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)
  })

  it('should authenticate an purchase token', async () => {
    const response = await createUseCase().execute({ token: 'test' })

    expect(userRepository.findOneByUuid).toHaveBeenCalledWith('1-2-3')

    expect(response.success).toBeTruthy()

    expect(response.user).toEqual(user)
  })

  it('should not authenticate an purchase token if it is not found', async () => {
    purchaseTokenRepository.getUserUuidByToken = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({ token: 'test' })

    expect(response.success).toBeFalsy()
  })

  it('should not authenticate an purchase token if user is not found', async () => {
    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({ token: 'test' })

    expect(response.success).toBeFalsy()
  })
})
