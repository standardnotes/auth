import { Setting } from '../../../Setting/Setting'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { GetSettings } from '../GetSettings'

export class GetSettingsTest {
  static makeSubject(settings: Setting[] = []): GetSettings {
    return new GetSettings(
      new SettingRepostioryStub(settings),
    )
  }
}
