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
    const userPromise = (async () => user)()

    const { 
      settings: partialSettings = [],
    } = associated

    const settings = partialSettings.map(setting => 
      SettingTest.makeSubject({ ...setting, user: userPromise })
    )
    
    Object.assign(user, {
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
      ...props,
    })

    return user
  }
}
