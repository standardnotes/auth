import { Setting } from '../../Setting/Setting'
import { SettingTest } from '../../Setting/test/SettingTest'
import { User } from '../User'

export class UserTest {
  static defaultDate = new Date(0)
  static defaultStringPrefix = 'default-test-user-'

  /**
   * @param props user props to overwrite defaults
   * @param associated props for entites to be associated with the created user
   * @returns 
   */
  static makeSubject(
    props: Partial<User>, 
    associated: {
      settings?: Partial<Setting>[]
    } = {}
  ): User {
    const user: User = new User()

    const { 
      settings: partialSettings = [],
    } = associated

    const settings = partialSettings.map(setting => 
      SettingTest.makeSubject(setting, user)
    )

    const defaults = {
      uuid: UserTest.defaultStringPrefix + 'uuid',
      version: UserTest.defaultStringPrefix + 'version',
      createdAt: UserTest.defaultDate,
      updatedAt: UserTest.defaultDate,
      email: UserTest.defaultStringPrefix + 'email',
      encryptedPassword: UserTest.defaultStringPrefix + 'encryptedPassword',
      encryptedServerKey: UserTest.defaultStringPrefix + 'encryptedServerKey',
      kpCreated: UserTest.defaultStringPrefix + 'kpCreated',
      kpOrigination: UserTest.defaultStringPrefix + 'kpOrigination',
      lockedUntil: null,
      numberOfFailedAttempts: null,
      pwAlg: UserTest.defaultStringPrefix + 'pwAlg',
      pwCost: 1,
      pwFunc: UserTest.defaultStringPrefix + 'pwFunc',
      pwKeySize: 1,
      pwNonce: UserTest.defaultStringPrefix + 'pwNonce',
      pwSalt: UserTest.defaultStringPrefix + 'pwSalt',
      revokedSessions: (async () => [])(),
      roles: (async () => [])(),
      serverEncryptionVersion: 1,
      settings: (async () => settings)(),
      supportsSessions: (): boolean => true,
      updatedWithUserAgent: null,
    }
    
    Object.assign(user, defaults, props)

    return user
  }

  static makeWithSettings(): User {
    return UserTest.makeSubject({ 
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-1-uuid', name: 'setting-1-name' },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: 'setting-3-name' },
      ]
    })
  }
}
