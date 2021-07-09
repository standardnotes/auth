import { Setting } from '../Setting'
import { SettingService } from '../SettingService'
import { SettingRepositoryInterface } from '../SettingRepositoryInterface'
import { SettingRepostioryStub } from './SettingRepositoryStub'
import { Logger } from 'winston'
import { SettingFactory } from '../SettingFactory'

export class SettingServiceTest {
  static makeSubject({
    settings = [],
    repository = new SettingRepostioryStub(settings),
  }: {
    settings?: Setting[],
    repository?: SettingRepositoryInterface
  } = {}): SettingService {
    const logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()

    const setting = {} as jest.Mocked<Setting>

    const settingFactory = {} as jest.Mocked<SettingFactory>
    settingFactory.create = jest.fn().mockReturnValue(setting)
    settingFactory.createReplacement = jest.fn().mockReturnValue(setting)

    return new SettingService(
      settingFactory,
      repository,
      logger,
    )
  }
}
