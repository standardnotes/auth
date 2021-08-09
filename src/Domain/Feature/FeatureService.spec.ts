import 'reflect-metadata'

import { Role, RoleName, SubscriptionName } from '@standardnotes/auth'

import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'
import { User } from '../User/User'
import { UserSubscription } from '../User/UserSubscription'

import { FeatureService } from './FeatureService'
import { Permission, PermissionName } from '@standardnotes/features'

describe('FeatureService', () => {
  let roleToSubscriptionMap: RoleToSubscriptionMapInterface
  let user: User
  let role1: Role
  let role2: Role
  let subscription1: UserSubscription
  let subscription2: UserSubscription
  let permission1: Permission
  let permission2: Permission

  const createService = () => new FeatureService(roleToSubscriptionMap)

  beforeEach(() => {
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
    }

    subscription2 = {
      uuid: 'subscription-2-2-2',
      createdAt: 222,
      updatedAt: 333,
      planName: SubscriptionName.ProPlan,
      endsAt: 777,
      user: Promise.resolve(user),
    }

    user = {
      uuid: 'user-1-1-1',
      roles: Promise.resolve([role1]),
      subscriptions: Promise.resolve([subscription1]),
    } as jest.Mocked<User>
  })

  it('should return user features with `expiresAt` field', async () => {
    expect(await createService().getFeaturesForUser(user)).toEqual([
      {
        'contentType': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dockIcon': {
          'backgroundColor': '#9D7441',
          'borderColor': '#9D7441',
          'foregroundColor': '#ECE4DB',
          'type': 'circle',
        },
        'downloadUrl': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expiresAt': 555,
        'flags': [
          'New',
        ],
        'identifier': 'theme:autobiography',
        'marketingUrl': '',
        'name': 'Autobiography',
        'thumbnailUrl': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': '#{url_prefix}/themes/autobiography',
        'version': '1.0.0',
      },
    ])
  })

  it('should return user features with `expiresAt` field when user has more than 1 role & subscription', async () => {
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
        'contentType': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dockIcon': {
          'backgroundColor': '#9D7441',
          'borderColor': '#9D7441',
          'foregroundColor': '#ECE4DB',
          'type': 'circle',
        },
        'downloadUrl': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expiresAt': 555,
        'flags': [
          'New',
        ],
        'identifier': 'theme:autobiography',
        'marketingUrl': '',
        'name': 'Autobiography',
        'thumbnailUrl': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': '#{url_prefix}/themes/autobiography',
        'version': '1.0.0',
      },
      {
        'area': 'modal',
        'contentType': 'SN|Component',
        'description': '',
        'downloadUrl': '',
        'expiresAt': 777,
        'identifier': 'component:cloud-link',
        'marketingUrl': '',
        'name': '',
        'url': '',
        'version': '',
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
        'contentType': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dockIcon': {
          'backgroundColor': '#9D7441',
          'borderColor': '#9D7441',
          'foregroundColor': '#ECE4DB',
          'type': 'circle',
        },
        'downloadUrl': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expiresAt': 777,
        'flags': [
          'New',
        ],
        'identifier': 'theme:autobiography',
        'marketingUrl': '',
        'name': 'Autobiography',
        'thumbnailUrl': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': '#{url_prefix}/themes/autobiography',
        'version': '1.0.0',
      },
      {
        'area': 'modal',
        'contentType': 'SN|Component',
        'description': '',
        'downloadUrl': '',
        'expiresAt': 777,
        'identifier': 'component:cloud-link',
        'marketingUrl': '',
        'name': '',
        'url': '',
        'version': '',
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
        'contentType': 'SN|Theme',
        'description': 'A theme for writers and readers.',
        'dockIcon': {
          'backgroundColor': '#9D7441',
          'borderColor': '#9D7441',
          'foregroundColor': '#ECE4DB',
          'type': 'circle',
        },
        'downloadUrl': 'https://github.com/standardnotes/autobiography-theme/archive/1.0.0.zip',
        'expiresAt': 555,
        'flags': [
          'New',
        ],
        'identifier': 'theme:autobiography',
        'marketingUrl': '',
        'name': 'Autobiography',
        'thumbnailUrl': 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
        'url': '#{url_prefix}/themes/autobiography',
        'version': '1.0.0',
      },
      {
        'area': 'modal',
        'contentType': 'SN|Component',
        'description': '',
        'downloadUrl': '',
        'expiresAt': 111,
        'identifier': 'component:cloud-link',
        'marketingUrl': '',
        'name': '',
        'url': '',
        'version': '',
      },
    ])
  })
})
