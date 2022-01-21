import 'reflect-metadata'

import { TokenEncoderInterface, ValetTokenData } from '@standardnotes/auth'
import { CreateValetToken } from './CreateValetToken'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { TimerInterface } from '@standardnotes/time'
import { UserSubscription } from '../../Subscription/UserSubscription'

describe('CreateValetToken', () => {
  let tokenEncoder: TokenEncoderInterface<ValetTokenData>
  let settingService: SettingServiceInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let timer: TimerInterface
  const valetTokenTTL = 123

  const createUseCase = () => new CreateValetToken(
    tokenEncoder,
    settingService,
    userSubscriptionRepository,
    timer,
    valetTokenTTL
  )

  beforeEach(() => {
    tokenEncoder = {} as jest.Mocked<TokenEncoderInterface<ValetTokenData>>
    tokenEncoder.encodeExpirableToken = jest.fn().mockReturnValue('foobar')

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.findSetting = jest.fn().mockReturnValue({
      value: '123',
    })

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue({ endsAt: 123 } as jest.Mocked<UserSubscription>)

    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(100)
  })

  it('should create a read valet token', async () => {
    const response = await createUseCase().execute({
      operation: 'read',
      userUuid: '1-2-3',
      resources: ['1-2-3/2-3-4'],
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
      resources: ['1-2-3/2-3-4'],
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
      resources: ['1-2-3/2-3-4'],
    })

    expect(response).toEqual({
      success: false,
      reason: 'expired-subscription',
    })
  })

  it('should create a write valet token', async () => {
    const response = await createUseCase().execute({
      operation: 'write',
      userUuid: '1-2-3',
    })

    expect(tokenEncoder.encodeExpirableToken).toHaveBeenCalledWith({
      permittedOperation: 'write',
      permittedResources:  [
        expect.any(String),
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

  it('should create a write valet token if upload bytes settings do not exist', async () => {
    settingService.findSetting = jest.fn().mockReturnValue(undefined)

    const response = await createUseCase().execute({
      operation: 'write',
      userUuid: '1-2-3',
    })

    expect(tokenEncoder.encodeExpirableToken).toHaveBeenCalledWith({
      permittedOperation: 'write',
      permittedResources:  [
        expect.any(String),
      ],
      userUuid: '1-2-3',
      uploadBytesUsed: 0,
      uploadBytesLimit: 0,
    }, 123)

    expect(response).toEqual({
      success: true,
      valetToken: 'foobar',
    })
  })
})
