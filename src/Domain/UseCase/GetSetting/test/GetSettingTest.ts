import { SettingProjector } from '../../../../Projection/SettingProjector'
import { SettingProjectorTest } from '../../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../../Setting/Setting'
import { SettingRepositoryInterface } from '../../../Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { GetSetting } from '../GetSetting'

export class GetSettingTest {
  static makeSubject({
    settings = [],
    repository = new SettingRepostioryStub(settings),
    projector = SettingProjectorTest.get(),
  }: {
    settings?: Setting[],
    repository?: SettingRepositoryInterface,
    projector?: SettingProjector,
  } = {}): GetSetting {
    return new GetSetting(
      repository,
      projector,
    )
  }
}
