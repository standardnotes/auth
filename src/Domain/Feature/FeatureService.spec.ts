import 'reflect-metadata'

import { Role, RoleName, SubscriptionName } from '@standardnotes/auth'

import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { User } from '../User/User'
import { UserSubscription } from '../Subscription/UserSubscription'

import { FeatureService } from './FeatureService'
import { Permission, PermissionName } from '@standardnotes/features'
import { Setting } from '../Setting/Setting'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

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

  const createService = () => new FeatureService(roleToSubscriptionMap, settingService, extensionServerUrl)

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
    }

    subscription2 = {
      uuid: 'subscription-2-2-2',
      createdAt: 222,
      updatedAt: 333,
      planName: SubscriptionName.ProPlan,
      endsAt: 777,
      user: Promise.resolve(user),
      cancelled: false,
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
  })

  it('should return user features with `expires_at` field', async () => {
    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'content_type': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dock_icon': {
          'background_color': '#9D7441',
          'border_color': '#9D7441',
          'foreground_color': '#ECE4DB',
          'type': 'circle',
        },
        'download_url': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expires_at': 555,
        'flags': [
          'New',
        ],
        'identifier': 'org.standardnotes.theme-autobiography',
        'permission_name': 'theme:autobiography',
        'marketing_url': '',
        'name': 'Autobiography',
        'thumbnail_url': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': 'https://extension-server/abc123/themes/autobiography',
        'version': '1.0.0',
      },
    ])
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

    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'content_type': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dock_icon': {
          'background_color': '#9D7441',
          'border_color': '#9D7441',
          'foreground_color': '#ECE4DB',
          'type': 'circle',
        },
        'download_url': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expires_at': 555,
        'flags': [
          'New',
        ],
        'identifier': 'org.standardnotes.theme-autobiography',
        'permission_name': 'theme:autobiography',
        'marketing_url': '',
        'name': 'Autobiography',
        'thumbnail_url': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': '#{url_prefix}/themes/autobiography',
        'version': '1.0.0',
      },
    ])
  })

  it('should return user features without dedicated url if the extension key setting is missing', async () => {
    settingService.findSetting = jest.fn().mockReturnValue(undefined)

    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'content_type': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dock_icon': {
          'background_color': '#9D7441',
          'border_color': '#9D7441',
          'foreground_color': '#ECE4DB',
          'type': 'circle',
        },
        'download_url': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expires_at': 555,
        'flags': [
          'New',
        ],
        'identifier': 'org.standardnotes.theme-autobiography',
        'permission_name': 'theme:autobiography',
        'marketing_url': '',
        'name': 'Autobiography',
        'thumbnail_url': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': '#{url_prefix}/themes/autobiography',
        'version': '1.0.0',
      },
    ])
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

    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'content_type': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dock_icon': {
          'background_color': '#9D7441',
          'border_color': '#9D7441',
          'foreground_color': '#ECE4DB',
          'type': 'circle',
        },
        'download_url': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expires_at': 555,
        'flags': [
          'New',
        ],
        'identifier': 'org.standardnotes.theme-autobiography',
        'permission_name': 'theme:autobiography',
        'marketing_url': '',
        'name': 'Autobiography',
        'thumbnail_url': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': 'https://extension-server/abc123/themes/autobiography',
        'version': '1.0.0',
      },
      {
        'area': 'modal',
        'content_type': 'SN|Component',
        'description': 'Manage and install cloud backups, including Note History, Dropbox, Google Drive, OneDrive, and Daily Email Backups.',
        'download_url': '',
        'expires_at': 777,
        'identifier': 'org.standardnotes.cloudlink',
        'permission_name': 'component:cloud-link',
        'marketing_url': '',
        'name': 'CloudLink',
        'url': 'https://extension-server/abc123/components/cloudlink',
        'version': '1.2.3',
      },
    ])
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

    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'content_type': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dock_icon': {
          'background_color': '#9D7441',
          'border_color': '#9D7441',
          'foreground_color': '#ECE4DB',
          'type': 'circle',
        },
        'download_url': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expires_at': 777,
        'flags': [
          'New',
        ],
        'identifier': 'org.standardnotes.theme-autobiography',
        'permission_name': 'theme:autobiography',
        'marketing_url': '',
        'name': 'Autobiography',
        'thumbnail_url': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': 'https://extension-server/abc123/themes/autobiography',
        'version': '1.0.0',
      },
      {
        'area': 'modal',
        'content_type': 'SN|Component',
        'description': 'Manage and install cloud backups, including Note History, Dropbox, Google Drive, OneDrive, and Daily Email Backups.',
        'download_url': '',
        'expires_at': 777,
        'identifier': 'org.standardnotes.cloudlink',
        'permission_name': 'component:cloud-link',
        'marketing_url': '',
        'name': 'CloudLink',
        'url': 'https://extension-server/abc123/components/cloudlink',
        'version': '1.2.3',
      },
    ])
  })

  it('should not set the lesser expiration date for feature that matches duplicated permissions', async () => {
    roleToSubscriptionMap.getSubscriptionNameForRoleName = jest.fn()
      .mockReturnValueOnce(SubscriptionName.CorePlan)
      .mockReturnValueOnce(SubscriptionName.ProPlan)

    subscription2.endsAt = 111

    role2 = {
      name: RoleName.ProUser, uuid: 'role-2-2-2',
      permissions: Promise.resolve([permission1, permission2]),
    } as jest.Mocked<Role>
    user = {
      uuid: 'user-1-1-1',
      roles: Promise.resolve([role1, role2]),
      subscriptions: Promise.resolve([subscription1, subscription2]),
    } as jest.Mocked<User>

    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'content_type': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dock_icon': {
          'background_color': '#9D7441',
          'border_color': '#9D7441',
          'foreground_color': '#ECE4DB',
          'type': 'circle',
        },
        'download_url': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expires_at': 555,
        'flags': [
          'New',
        ],
        'identifier': 'org.standardnotes.theme-autobiography',
        'permission_name': 'theme:autobiography',
        'marketing_url': '',
        'name': 'Autobiography',
        'thumbnail_url': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': 'https://extension-server/abc123/themes/autobiography',
        'version': '1.0.0',
      },
      {
        'area': 'modal',
        'content_type': 'SN|Component',
        'description': 'Manage and install cloud backups, including Note History, Dropbox, Google Drive, OneDrive, and Daily Email Backups.',
        'download_url': '',
        'expires_at': 111,
        'identifier': 'org.standardnotes.cloudlink',
        'permission_name': 'component:cloud-link',
        'marketing_url': '',
        'name': 'CloudLink',
        'url': 'https://extension-server/abc123/components/cloudlink',
        'version': '1.2.3',
      },
    ])
  })
})
