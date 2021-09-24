import { SettingName } from '@standardnotes/settings'
import { TimerInterface } from '@standardnotes/time'
import 'reflect-metadata'
import { Logger } from 'winston'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { RoleServiceInterface } from '../../Role/RoleServiceInterface'

import { Setting } from '../../Setting/Setting'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { PaymentsHttpServiceInterface } from '../../Subscription/PaymentsHttpServiceInterface'
import { UserSubscription } from '../../Subscription/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UpdateSetting } from './UpdateSetting'

describe('UpdateSetting', () => {
  let settingService: SettingServiceInterface
  let settingProjection: SimpleSetting
  let settingProjector: SettingProjector
  let setting: Setting
  let user: User
  let userRepository: UserRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let roleService: RoleServiceInterface
  let paymentsHttpService: PaymentsHttpServiceInterface
  let timer: TimerInterface
  let logger: Logger

  const createUseCase = () => new UpdateSetting(
    settingService,
    settingProjector,
    userRepository,
    userSubscriptionRepository,
    roleService,
    paymentsHttpService,
    timer,
    logger
  )

  beforeEach(() => {
    setting = {} as jest.Mocked<Setting>

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.createOrReplace = jest.fn().mockReturnValue({ status: 'created', setting })

    settingProjector = {} as jest.Mocked<SettingProjector>
    settingProjector.projectSimple = jest.fn().mockReturnValue(settingProjection)

    user = {} as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(undefined)
    userSubscriptionRepository.save = jest.fn()

    roleService = {} as jest.Mocked<RoleServiceInterface>
    roleService.addUserRole = jest.fn()

    paymentsHttpService = {} as jest.Mocked<PaymentsHttpServiceInterface>
    paymentsHttpService.getUser = jest.fn().mockReturnValue({
      id: 1,
      email: 'test@test.te',
      extension_server_key: 'a-b-c',
      subscription: {
        canceled: false,
        created_at: new Date(1).toString(),
        updated_at: new Date(2).toString(),
        active_until: new Date(3).toString(),
      },
    })

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertStringDateToMicroseconds = jest.fn().mockReturnValue(1)

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
    logger.error = jest.fn()
  })

  it('should create a setting', async () => {
    const props = {
      name: 'test-setting-name',
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: false,
    }

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'test-setting-name',
        value: 'test-setting-value',
        serverEncryptionVersion: 0,
        sensitive: false,
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
      sensitive: false,
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

  it('should handle client side migration of extension key to fill in the subscription data', async () => {
    const props = {
      name: SettingName.ExtensionKey,
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: true,
    }

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'EXTENSION_KEY',
        value: 'test-setting-value',
        serverEncryptionVersion: 0,
        sensitive: true,
      },
      user,
    })

    expect(roleService.addUserRole).toHaveBeenCalledWith({}, 'PRO_PLAN')

    expect(userSubscriptionRepository.save).toHaveBeenCalledWith({
      cancelled: false,
      createdAt: 1,
      endsAt: 1,
      planName: 'PRO_PLAN',
      updatedAt: 1,
      user: Promise.resolve(user),
    })

    expect(response).toEqual({
      success: true,
      setting: settingProjection,
      statusCode: 201,
    })
  })

  it('should skip client side migration of extension key to fill in the subscription data - existing subscription', async () => {
    const props = {
      name: SettingName.ExtensionKey,
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: true,
    }

    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue({} as jest.Mocked<UserSubscription>)

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'EXTENSION_KEY',
        value: 'test-setting-value',
        serverEncryptionVersion: 0,
        sensitive: true,
      },
      user,
    })

    expect(roleService.addUserRole).not.toHaveBeenCalled()

    expect(userSubscriptionRepository.save).not.toHaveBeenCalled()

    expect(response).toEqual({
      success: true,
      setting: settingProjection,
      statusCode: 201,
    })
  })

  it('should skip client side migration of extension key to fill in the subscription data - missing data from payments', async () => {
    const props = {
      name: SettingName.ExtensionKey,
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: true,
    }

    paymentsHttpService.getUser = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'EXTENSION_KEY',
        value: 'test-setting-value',
        serverEncryptionVersion: 0,
        sensitive: true,
      },
      user,
    })

    expect(roleService.addUserRole).not.toHaveBeenCalled()

    expect(userSubscriptionRepository.save).not.toHaveBeenCalled()

    expect(response).toEqual({
      success: true,
      setting: settingProjection,
      statusCode: 201,
    })
  })

  it('should skip client side migration of extension key to fill in the subscription data - error occurred', async () => {
    const props = {
      name: SettingName.ExtensionKey,
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
      sensitive: true,
    }

    paymentsHttpService.getUser = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    const response = await createUseCase().execute({ props, userUuid: '1-2-3' })

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'EXTENSION_KEY',
        value: 'test-setting-value',
        serverEncryptionVersion: 0,
        sensitive: true,
      },
      user,
    })

    expect(roleService.addUserRole).not.toHaveBeenCalled()

    expect(userSubscriptionRepository.save).not.toHaveBeenCalled()

    expect(response).toEqual({
      success: true,
      setting: settingProjection,
      statusCode: 201,
    })
  })
})
