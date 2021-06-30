import { Setting } from '../Setting'
import { SettingFactory } from '../SettingFactory'
import { SettingService } from '../SettingService'
import { SettingRepositoryInterface } from '../SettingRepositoryInterface'
import { SettingFactoryTest } from './SettingFactoryTest'
import { SettingRepostioryStub } from './SettingRepositoryStub'
import { Logger } from 'winston'

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
    const logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()

    return new SettingService(
      factory,
      repository,
      logger,
    )
  }
}
