import { Setting } from '../Setting'
import { SettingFactory } from '../SettingFactory'
import { SettingPersister } from '../SettingPersister'
import { SettingRepositoryInterface } from '../SettingRepositoryInterface'
import { SettingFactoryTest } from './SettingFactoryTest'
import { SettingRepostioryStub } from './SettingRepositoryStub'

export class SettingPersisterTest {
  static makeSubject({
    settings = [],
    factory = SettingFactoryTest.makeSubject(),
    repository = new SettingRepostioryStub(settings),
  }: {
    settings?: Setting[],
    factory?: SettingFactory,
    repository?: SettingRepositoryInterface
  } = {}): SettingPersister {
    return new SettingPersister(
      factory,
      repository,
    )
  }
}
