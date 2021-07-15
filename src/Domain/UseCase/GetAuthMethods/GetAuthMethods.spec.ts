import 'reflect-metadata'

import { User } from '../../User/User'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { GetAuthMethods } from './GetAuthMethods'
import { Setting } from '../../Setting/Setting'

describe('GetAuthMethods', () => {
  let user: User
  let setting: Setting
  let settingRepository: SettingRepositoryInterface
  let userRepository: UserRepositoryInterface

  const createUseCase = () => new GetAuthMethods(settingRepository, userRepository)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    setting = {
      value: 'test',
    } as jest.Mocked<Setting>

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
  })

  it('should return real methods for valid user email', async () => {
    const response = await createUseCase().execute({ email: 'test@test.te' })

    expect(response).toEqual({
      success: true,
      methods: {
        totp: true,
      },
    })
  })

  it('should not return totp methods if setting is reset', async () => {
    setting = {
      value: null,
    } as jest.Mocked<Setting>
    settingRepository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    const response = await createUseCase().execute({ email: 'test@test.te' })

    expect(response).toEqual({
      success: true,
      methods: {},
    })
  })

  it('should return fake methods for invalid user email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({ email: 'test@test.te' })

    expect(response).toEqual({
      success: true,
      methods: {},
    })
  })
})
