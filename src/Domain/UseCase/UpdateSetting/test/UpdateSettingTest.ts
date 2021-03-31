import { Setting } from '../../../Setting/Setting'
import { SettingRepositoryInterface } from '../../../Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { UpdateSetting } from '../UpdateSetting'

export class UpdateSettingTest {
  static makeSubject({
    settings = [],
    settingRepository = new SettingRepostioryStub(settings),
    userRepository,
  }: {
    settings?: Setting[],
    settingRepository?: SettingRepositoryInterface,
    userRepository: UserRepositoryInterface,
  }): UpdateSetting {
    return new UpdateSetting(
      settingRepository,
      userRepository,
    )
  }
}
