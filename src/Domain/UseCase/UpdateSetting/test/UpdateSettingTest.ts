import { Setting } from '../../../Setting/Setting'
import { SettingService } from '../../../Setting/SettingService'
import { SettingServiceTest } from '../../../Setting/test/SettingServiceTest'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { UpdateSetting } from '../UpdateSetting'

export class UpdateSettingTest {
  static makeSubject({
    settings = [],
    settingService = SettingServiceTest.makeSubject({ settings }),
    userRepository,
  }: {
    settings?: Setting[],
    settingService?: SettingService,
    userRepository: UserRepositoryInterface,
  }): UpdateSetting {
    return new UpdateSetting(
      settingService,
      userRepository,
    )
  }
}
