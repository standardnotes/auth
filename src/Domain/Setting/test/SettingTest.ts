import { User } from '../../User/User'
import { Setting } from '../Setting'

export class SettingTest {
  static defaultStringPrefix = 'default-test-setting-'
  static defaultDate = new Date(0)
  
  static makeSubject(
    props: Partial<Setting>,
    associatedUser: User,
  ): Setting {
    const setting: Setting = new Setting()

    const defaults: Setting = {
      uuid: SettingTest.defaultStringPrefix + '-uuid',
      createdAt: SettingTest.defaultDate,
      updatedAt: SettingTest.defaultDate,
      name: SettingTest.defaultStringPrefix + 'name',
      serverEncryptionVersion: 1,
      user: (async () => associatedUser)(),
      value: SettingTest.defaultStringPrefix + 'value',
    }

    Object.assign(setting, defaults, props)

    return setting
  }
}
