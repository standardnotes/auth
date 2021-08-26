import 'reflect-metadata'
import { Feature } from '@standardnotes/features'
import { GetUserFeatures } from './GetUserFeatures'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { User } from '../../User/User'
import { FeatureServiceInterface } from '../../Feature/FeatureServiceInterface'

describe('GetUserFeatures', () => {
  let user: User
  let userRepository: UserRepositoryInterface
  let feature1: Feature
  let featureService: FeatureServiceInterface

  const createUseCase = () => new GetUserFeatures(userRepository, featureService)

  beforeEach(() => {
    user = {} as jest.Mocked<User>
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    feature1 = { name: 'foobar' }  as jest.Mocked<Feature>
    featureService = {} as jest.Mocked<FeatureServiceInterface>
    featureService.getFeaturesForUser = jest.fn().mockReturnValue([feature1])
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

  it('should return user features', async () => {
    expect(await createUseCase().execute({ userUuid: 'user-1-1-1' })).toEqual({
      success: true,
      userUuid: 'user-1-1-1',
      features: [{
        name: 'foobar',
      }],
    })
  })
})
