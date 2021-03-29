import { User } from '../../User/User'
import { Setting } from '../Setting'

export class SettingTest {
  static defaultUser = new User()
  static defaultStringPrefix = 'default-test-setting-'
  static defaultDate = new Date(0)
  
  static makeSubject(props: Partial<Setting>): Setting {
    const setting: Setting = new Setting()

    const defaults: Setting = {
      uuid: SettingTest.defaultStringPrefix + '-uuid',
      createdAt: SettingTest.defaultDate,
      updatedAt: SettingTest.defaultDate,
      name: SettingTest.defaultStringPrefix + 'name',
      serverEncryptionVersion: 1,
      user: (async () => SettingTest.defaultUser)(),
      value: SettingTest.defaultStringPrefix + 'value',
      ...props,
    }

    Object.assign(setting, defaults)

    return setting
  }
}
