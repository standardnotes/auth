import { SettingProjector } from '../../../../Projection/SettingProjector'
import { Setting } from '../../../Setting/Setting'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { GetSettings } from '../GetSettings'

export class GetSettingsTest {
  static settingProjector = new SettingProjector()
  static makeSubject(
    settings: Setting[] = [],
    projector = GetSettingsTest.settingProjector,
  ): GetSettings {
    return new GetSettings(
      new SettingRepostioryStub(settings),
      projector,
    )
  }
}
