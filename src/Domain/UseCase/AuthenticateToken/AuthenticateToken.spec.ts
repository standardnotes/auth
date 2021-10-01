import 'reflect-metadata'
import { RoleName } from '@standardnotes/auth'

import { EphemeralTokenRepositoryInterface } from '../../Subscription/EphemeralTokenRepositoryInterface'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'

import { AuthenticateToken } from './AuthenticateToken'

describe('AuthenticateToken', () => {
  let ephemeralTokenRepository: EphemeralTokenRepositoryInterface
  let userRepository: UserRepositoryInterface
  let user: User

  const createUseCase = () => new AuthenticateToken(ephemeralTokenRepository, userRepository)

  beforeEach(() => {
    ephemeralTokenRepository = {} as jest.Mocked<EphemeralTokenRepositoryInterface>
    ephemeralTokenRepository.getUserUuidByToken = jest.fn().mockReturnValue('1-2-3')

    user = {
      roles: Promise.resolve([{ name: RoleName.CoreUser }]),
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)
  })

  it('should authenticate an ephemeral token', async () => {
    const response = await createUseCase().execute({ token: 'test' })

    expect(userRepository.findOneByUuid).toHaveBeenCalledWith('1-2-3')

    expect(response.success).toBeTruthy()

    expect(response.user).toEqual(user)
  })

  it('should not authenticate an ephemeral token if it is not found', async () => {
    ephemeralTokenRepository.getUserUuidByToken = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({ token: 'test' })

    expect(response.success).toBeFalsy()
  })

  it('should not authenticate an ephemeral token if user is not found', async () => {
    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({ token: 'test' })

    expect(response.success).toBeFalsy()
  })
})
