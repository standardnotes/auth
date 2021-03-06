import 'reflect-metadata'
import { Logger } from 'winston'
import { SettingProjector } from '../../../Projection/SettingProjector'

import { Setting } from '../../Setting/Setting'
import { SettingService } from '../../Setting/SettingService'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UpdateSetting } from './UpdateSetting'

describe('UpdateSetting', () => {
  let settingService: SettingService
  let settingProjection: SimpleSetting
  let settingProjector: SettingProjector
  let setting: Setting
  let user: User
  let userRepository: UserRepositoryInterface
  let logger: Logger

  const createUseCase = () => new UpdateSetting(settingService, settingProjector, userRepository, logger)

  beforeEach(() => {
    setting = {} as jest.Mocked<Setting>

    settingService = {} as jest.Mocked<SettingService>
    settingService.createOrReplace = jest.fn().mockReturnValue({ status: 'created', setting })

    settingProjector = {} as jest.Mocked<SettingProjector>
    settingProjector.projectSimple = jest.fn().mockReturnValue(settingProjection)

    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should create a setting', async () => {
    const props = {
      name: 'test-setting-name',
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
    }

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'test-setting-name',
        value: 'test-setting-value',
        serverEncryptionVersion: 0,
      },
      user,
    })

    expect(response).toEqual({
      success: true,
      setting: settingProjection,
      statusCode: 201,
    })
  })

  it('should not create a setting if user does not exist', async () => {
    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    const props = {
      name: 'test-setting-name',
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
    }

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).not.toHaveBeenCalled()

    expect(response).toEqual({
      success: false,
      error: {
        message: 'User 1-2-3 not found.',
      },
    })
  })
})
