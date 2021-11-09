import 'reflect-metadata'

import { Role, RoleName, SubscriptionName } from '@standardnotes/auth'

import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { User } from '../User/User'
import { UserSubscription } from '../Subscription/UserSubscription'

import { FeatureService } from './FeatureService'
import { Permission, PermissionName } from '@standardnotes/features'
import { Setting } from '../Setting/Setting'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { TokenDecoderInterface } from '../Auth/TokenDecoderInterface'
import { TimerInterface } from '@standardnotes/time'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'

describe('FeatureService', () => {
  let roleToSubscriptionMap: RoleToSubscriptionMapInterface
  let user: User
  let role1: Role
  let role2: Role
  let subscription1: UserSubscription
  let subscription2: UserSubscription
  let permission1: Permission
  let permission2: Permission
  let extensionKeySetting: Setting
  let settingService: SettingServiceInterface
  let extensionServerUrl: string
  let offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface
  let tokenDecoder: TokenDecoderInterface
  let timer: TimerInterface
  let offlineUserSubscription: OfflineUserSubscription

  const createService = () => new FeatureService(
    roleToSubscriptionMap,
    settingService,
    offlineUserSubscriptionRepository,
    tokenDecoder,
    timer,
    extensionServerUrl
  )

  beforeEach(() => {
    extensionServerUrl = 'https://extension-server'

    roleToSubscriptionMap = {} as jest.Mocked<RoleToSubscriptionMapInterface>
    roleToSubscriptionMap.getSubscriptionNameForRoleName = jest.fn().mockReturnValue(SubscriptionName.CorePlan)

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
      cancelled: false,
      subscriptionId: 1,
    }

    subscription2 = {
      uuid: 'subscription-2-2-2',
      createdAt: 222,
      updatedAt: 333,
      planName: SubscriptionName.ProPlan,
      endsAt: 777,
      user: Promise.resolve(user),
      cancelled: false,
      subscriptionId: 2,
    }

    user = {
      uuid: 'user-1-1-1',
      roles: Promise.resolve([role1]),
      subscriptions: Promise.resolve([subscription1]),
    } as jest.Mocked<User>

    extensionKeySetting = {
      name: 'EXTENSION_KEY',
      value: 'abc123',
    } as jest.Mocked<Setting>

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.findSetting = jest.fn().mockReturnValue(extensionKeySetting)

    offlineUserSubscription = {
      roles: Promise.resolve([role1]),
      uuid: 'subscription-1-1-1',
      createdAt: 111,
      updatedAt: 222,
      planName: SubscriptionName.CorePlan,
      endsAt: 555,
      cancelled: false,
    } as jest.Mocked<OfflineUserSubscription>

    offlineUserSubscriptionRepository = {} as jest.Mocked<OfflineUserSubscriptionRepositoryInterface>
    offlineUserSubscriptionRepository.findByEmail = jest.fn().mockReturnValue([offlineUserSubscription])

    tokenDecoder = {} as jest.Mocked<TokenDecoderInterface>
    tokenDecoder.decodeOfflineToken = jest.fn().mockReturnValue({ extensionKey: 'test', featuresUrl: 'https://api.standardnotes.com/v1/offline/features' })

    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(123)
  })

  describe('offline subscribers', () => {
    it('should return user features with `expires_at` field', async () => {
      const features = await createService()
        .getFeaturesForOfflineUser('test@test.com', 'features-token')

      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            expires_at: 555,
          }),
        ])
      )
    })

    it('should not return user features if a subscription could not be found', async () => {
      offlineUserSubscriptionRepository.findByEmail = jest.fn().mockReturnValue([])

      expect(await createService().getFeaturesForOfflineUser('test@test.com', 'features-token')).toEqual([])
    })

    it('should not return user features if a features token could not be decoded', async () => {
      tokenDecoder.decodeOfflineToken = jest.fn().mockReturnValue(undefined)

      expect(await createService().getFeaturesForOfflineUser('test@test.com', 'features-token')).toEqual([])
    })
  })

  describe('online subscribers', () => {
    it('should return user features with `expires_at` field', async () => {
      const features = await createService().getFeaturesForUser(user)
      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            expires_at: 555,
          }),
        ])
      )
    })

    it('should not return user features if a subscription could not be found', async () => {
      const subscriptions: Array<UserSubscription> = []

      user = {
        uuid: 'user-1-1-1',
        roles: Promise.resolve([role1]),
        subscriptions: Promise.resolve(subscriptions),
      } as jest.Mocked<User>

      expect(await createService().getFeaturesForUser(user)).toEqual([])
    })

    it('should return user features without dedicated url if the extension server url is missing', async () => {
      extensionServerUrl = ''

      const features = await createService().getFeaturesForUser(user)
      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            url: '#{url_prefix}/themes/autobiography',
          }),
        ])
      )
    })

    it('should return user features without dedicated url if the extension key setting is missing', async () => {
      settingService.findSetting = jest.fn().mockReturnValue(undefined)

      const features = await createService().getFeaturesForUser(user)
      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            url: '#{url_prefix}/themes/autobiography',
          }),
        ])
      )
    })

    it('should return user features with `expires_at` field when user has more than 1 role & subscription', async () => {
      roleToSubscriptionMap.getSubscriptionNameForRoleName = jest.fn()
        .mockReturnValueOnce(SubscriptionName.CorePlan)
        .mockReturnValueOnce(SubscriptionName.ProPlan)

      user = {
        uuid: 'user-1-1-1',
        roles: Promise.resolve([role1, role2]),
        subscriptions: Promise.resolve([subscription1, subscription2]),
      } as jest.Mocked<User>

      const features = await createService().getFeaturesForUser(user)
      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            expires_at: 555,
          }),
          expect.objectContaining({
            identifier: 'org.standardnotes.cloudlink',
            expires_at: 777,
          }),
        ])
      )
    })

    it('should set the longest expiration date for feature that matches duplicated permissions', async () => {
      roleToSubscriptionMap.getSubscriptionNameForRoleName = jest.fn()
        .mockReturnValueOnce(SubscriptionName.CorePlan)
        .mockReturnValueOnce(SubscriptionName.ProPlan)

      role2 = {
        name: RoleName.ProUser, uuid: 'role-2-2-2',
        permissions: Promise.resolve([permission1, permission2]),
      } as jest.Mocked<Role>
      user = {
        uuid: 'user-1-1-1',
        roles: Promise.resolve([role1, role2]),
        subscriptions: Promise.resolve([subscription1, subscription2]),
      } as jest.Mocked<User>

      const longestExpireAt = 777

      const features = await createService().getFeaturesForUser(user)
      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            expires_at: longestExpireAt,
          }),
          expect.objectContaining({
            identifier: 'org.standardnotes.cloudlink',
            expires_at: longestExpireAt,
          }),
        ])
      )
    })

    it('should not set the lesser expiration date for feature that matches duplicated permissions', async () => {
      roleToSubscriptionMap.getSubscriptionNameForRoleName = jest.fn()
        .mockReturnValueOnce(SubscriptionName.CorePlan)
        .mockReturnValueOnce(SubscriptionName.ProPlan)

      const lesserExpireAt = 111
      subscription2.endsAt = lesserExpireAt

      role2 = {
        name: RoleName.ProUser, uuid: 'role-2-2-2',
        permissions: Promise.resolve([permission1, permission2]),
      } as jest.Mocked<Role>
      user = {
        uuid: 'user-1-1-1',
        roles: Promise.resolve([role1, role2]),
        subscriptions: Promise.resolve([subscription1, subscription2]),
      } as jest.Mocked<User>

      const features = await createService().getFeaturesForUser(user)
      expect(features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'org.standardnotes.theme-autobiography',
            expires_at: 555,
          }),
          expect.objectContaining({
            identifier: 'org.standardnotes.cloudlink',
            expires_at: lesserExpireAt,
          }),
        ])
      )
    })
  })
})
