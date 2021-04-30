import { Setting } from '../../../Setting/Setting'
import { SettingRepositoryInterface } from '../../../Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { DeleteSetting } from '../DeleteSetting'

export class DeleteSettingTest {
  static makeSubject({
    settings = [],
    settingRepository = new SettingRepostioryStub(settings),
  }: {
    settings?: Setting[],
    settingRepository?: SettingRepositoryInterface,
  }): DeleteSetting {
    return new DeleteSetting(
      settingRepository,
    )
  }
}
