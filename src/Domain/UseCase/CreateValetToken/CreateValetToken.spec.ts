import 'reflect-metadata'

import { TokenEncoderInterface, ValetTokenData } from '@standardnotes/auth'
import { CreateValetToken } from './CreateValetToken'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'
import { UserSubscription } from '../../Subscription/UserSubscription'
import { SettingsAssociationServiceInterface } from '../../Setting/SettingsAssociationServiceInterface'

describe('CreateValetToken', () => {
  let tokenEncoder: TokenEncoderInterface<ValetTokenData>
  let settingService: SettingServiceInterface
  let settingsAssociationService: SettingsAssociationServiceInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let timer: TimerInterface
  const valetTokenTTL = 123

  const createUseCase = () => new CreateValetToken(
    tokenEncoder,
    settingService,
    settingsAssociationService,
    userSubscriptionRepository,
    timer,
    valetTokenTTL
  )

  beforeEach(() => {
    tokenEncoder = {} as jest.Mocked<TokenEncoderInterface<ValetTokenData>>
    tokenEncoder.encodeExpirableToken = jest.fn().mockReturnValue('foobar')

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.findSettingWithDecryptedValue = jest.fn().mockReturnValue({
      value: '123',
    })

    settingsAssociationService = {} as jest.Mocked<SettingsAssociationServiceInterface>
    settingsAssociationService.getFileUploadLimit = jest.fn().mockReturnValue(5_368_709_120)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue({ endsAt: 123 } as jest.Mocked<UserSubscription>)

    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(100)
  })

  it('should create a read valet token', async () => {
    const response = await createUseCase().execute({
      operation: 'read',
      userUuid: '1-2-3',
      resources: [
        {
          remoteIdentifier: '1-2-3/2-3-4',
          unencryptedFileSize: 123,
        },
      ],
    })

    expect(response).toEqual({
      success: true,
      valetToken: 'foobar',
    })
  })

  it('should not create a valet token if a user has no subscription', async () => {
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({
      operation: 'read',
      userUuid: '1-2-3',
      resources: [
        {
          remoteIdentifier: '1-2-3/2-3-4',
          unencryptedFileSize: 123,
        },
      ],
    })

    expect(response).toEqual({
      success: false,
      reason: 'no-subscription',
    })
  })

  it('should not create a valet token if a user has an expired subscription', async () => {
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(150)

    const response = await createUseCase().execute({
      operation: 'read',
      userUuid: '1-2-3',
      resources: [
        {
          remoteIdentifier: '1-2-3/2-3-4',
          unencryptedFileSize: 123,
        },
      ],
    })

    expect(response).toEqual({
      success: false,
      reason: 'expired-subscription',
    })
  })

  it('should not create a write valet token if unencrypted file size has not been provided for a resource', async () => {
    const response = await createUseCase().execute({
      operation: 'write',
      resources: [
        {
          remoteIdentifier: '2-3-4',
        },
      ],
      userUuid: '1-2-3',
    })

    expect(response).toEqual({
      success: false,
      reason: 'invalid-parameters',
    })
  })

  it('should create a write valet token', async () => {
    const response = await createUseCase().execute({
      operation: 'write',
      resources: [
        {
          remoteIdentifier: '2-3-4',
          unencryptedFileSize: 123,
        },
      ],
      userUuid: '1-2-3',
    })

    expect(tokenEncoder.encodeExpirableToken).toHaveBeenCalledWith({
      permittedOperation: 'write',
      permittedResources:  [
        {
          remoteIdentifier: '2-3-4',
          unencryptedFileSize: 123,
        },
      ],
      userUuid: '1-2-3',
      uploadBytesUsed: 123,
      uploadBytesLimit: 123,
    }, 123)

    expect(response).toEqual({
      success: true,
      valetToken: 'foobar',
    })
  })

  it('should create a write valet token with default subscription upload limit if upload bytes settings do not exist', async () => {
    settingService.findSettingWithDecryptedValue = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({
      operation: 'write',
      userUuid: '1-2-3',
      resources: [
        {
          remoteIdentifier: '2-3-4',
          unencryptedFileSize: 123,
        },
      ],
    })

    expect(tokenEncoder.encodeExpirableToken).toHaveBeenCalledWith({
      permittedOperation: 'write',
      permittedResources:  [
        {
          remoteIdentifier: '2-3-4',
          unencryptedFileSize: 123,
        },
      ],
      userUuid: '1-2-3',
      uploadBytesUsed: 0,
      uploadBytesLimit: 5368709120,
    }, 123)

    expect(response).toEqual({
      success: true,
      valetToken: 'foobar',
    })
  })
})
