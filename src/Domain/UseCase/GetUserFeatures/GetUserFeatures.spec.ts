import 'reflect-metadata'
import { Features } from '@standardnotes/features'
import { GetUserFeatures } from './GetUserFeatures'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { User } from '../../User/User'
import { Permission, PermissionName, Role, RoleName, SubscriptionName } from '@standardnotes/auth'
import { UserSubscription } from '../../User/UserSubscription'

describe('GetUserFeatures', () => {
  let userRepository: UserRepositoryInterface
  let user: User
  let role1: Role
  let role2: Role
  let subscription1: UserSubscription
  let subscription2: UserSubscription
  let permission1: Permission
  let permission2: Permission

  const createUseCase = () => new GetUserFeatures(userRepository)

  beforeEach(() => {
    permission1 = {
      uuid: 'permission-1-1-1',
      name: PermissionName.AutobiographyTheme,
    }
    permission2 = {
      uuid: 'permission-2-2-2',
      name: PermissionName.CloudLink,
    }

    role1 = {
      name: RoleName.CoreUser,
      uuid: 'role-1-1-1',
      permissions: Promise.resolve([permission1]),
    } as jest.Mocked<Role>

    role2 = {
      name: RoleName.ProUser, uuid: 'role-2-2-2',
      permissions: Promise.resolve([permission2]),
    } as jest.Mocked<Role>

    subscription1 = {
      uuid: 'subscription-1-1-1',
      createdAt: 111,
      updatedAt: 222,
      planName: SubscriptionName.CorePlan,
      endsAt: 555,
      user: Promise.resolve(user),
    }


    subscription2 = {
      uuid: 'subscription-2-2-2',
      createdAt: 222,
      updatedAt: 333,
      planName: SubscriptionName.ProPlan,
      endsAt: 444,
      user: Promise.resolve(user),
    }

    user = {
      uuid: 'user-1-1-1',
      roles: Promise.resolve([role1]),
      subscriptions: Promise.resolve([subscription1]),
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)
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

  describe('success case', () => {
    it('should return user\'s features with `expiresAt` field', async () => {
      const feature = Features.find(feature => feature.identifier === PermissionName.AutobiographyTheme)

      expect(await createUseCase().execute({ userUuid: user.uuid })).toEqual({
        success: true,
        userUuid: user.uuid,
        features: [{
          ...feature,
          expiresAt: subscription1.endsAt,
        }],
      })
    })

    it('should return user\'s features with `expiresAt` field when user has more than 1 role & subscription', async () => {
      user = {
        uuid: 'user-1-1-1',
        roles: Promise.resolve([role1, role2]),
        subscriptions: Promise.resolve([subscription1, subscription2]),
      } as jest.Mocked<User>
      userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

      const autobiographyFeature = Features.find(feature => feature.identifier === PermissionName.AutobiographyTheme)
      const cloudLinkFeature = Features.find(feature => feature.identifier === PermissionName.CloudLink)

      const featuresData = [{
        ...autobiographyFeature,
        expiresAt: subscription1.endsAt,
      }, {
        ...cloudLinkFeature,
        expiresAt: subscription2.endsAt,
      }]

      expect(await createUseCase().execute({ userUuid: user.uuid })).toEqual({
        success: true,
        userUuid: user.uuid,
        features: featuresData,
      })
    })
  })
})
