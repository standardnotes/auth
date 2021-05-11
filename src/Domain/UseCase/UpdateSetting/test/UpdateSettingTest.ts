import { Setting } from '../../../Setting/Setting'
import { SettingPersister } from '../../../Setting/SettingPersister'
import { SettingPersisterTest } from '../../../Setting/test/SettingPersisterTest'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { UpdateSetting } from '../UpdateSetting'

export class UpdateSettingTest {
  static makeSubject({
    settings = [],
    settingPersister = SettingPersisterTest.makeSubject({ settings }),
    userRepository,
  }: {
    settings?: Setting[],
    settingPersister?: SettingPersister,
    userRepository: UserRepositoryInterface,
  }): UpdateSetting {
    return new UpdateSetting(
      settingPersister,
      userRepository,
    )
  }
}
