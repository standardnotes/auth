import 'reflect-metadata'
import { GetUserSubscription } from './GetUserSubscription'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { User } from '../../User/User'
import { UserSubscriptionRepositoryInterface } from '../../User/UserSubscriptionRepositoryInterface'
import { UserSubscription } from '../../User/UserSubscription'
import { SubscriptionName } from '@standardnotes/auth'

describe('GetUserSubscription', () => {
  let user: User
  let userSubscription: UserSubscription
  let userRepository: UserRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface

  const createUseCase = () => new GetUserSubscription(userRepository, userSubscriptionRepository)

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    userSubscription = {
      planName: SubscriptionName.ProPlan,
    } as jest.Mocked<UserSubscription>
    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(userSubscription)
  })

  it('should fail if a user is not found', async () => {
    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ userUuid: 'user-1-1-1' })).toEqual({
      success: false,
      error: {
        message: 'User user-1-1-1 not found.',
      },
    })
  })

  it('should return user subscription', async () => {
    expect(await createUseCase().execute({ userUuid: 'user-1-1-1' })).toEqual({
      success: true,
      userUuid: 'user-1-1-1',
      subscription: {
        planName: SubscriptionName.ProPlan,
      },
    })
  })
})
