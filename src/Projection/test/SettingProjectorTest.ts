import { SettingProjector } from '../SettingProjector'

export class SettingProjectorTest {
  static settingProjector = new SettingProjector()
  static get(): SettingProjector {
    return SettingProjectorTest.settingProjector
  }
}
