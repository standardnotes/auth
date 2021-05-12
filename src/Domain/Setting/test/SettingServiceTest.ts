import { Setting } from '../Setting'
import { SettingFactory } from '../SettingFactory'
import { SettingService } from '../SettingService'
import { SettingRepositoryInterface } from '../SettingRepositoryInterface'
import { SettingFactoryTest } from './SettingFactoryTest'
import { SettingRepostioryStub } from './SettingRepositoryStub'

export class SettingServiceTest {
  static makeSubject({
    settings = [],
    factory = SettingFactoryTest.makeSubject(),
    repository = new SettingRepostioryStub(settings),
  }: {
    settings?: Setting[],
    factory?: SettingFactory,
    repository?: SettingRepositoryInterface
  } = {}): SettingService {
    return new SettingService(
      factory,
      repository,
    )
  }
}
