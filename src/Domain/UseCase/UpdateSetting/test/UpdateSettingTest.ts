import { Logger } from 'winston'
import { SettingProjector } from '../../../../Projection/SettingProjector'
import { SettingProjectorTest } from '../../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../../Setting/Setting'
import { SettingService } from '../../../Setting/SettingService'
import { SettingServiceTest } from '../../../Setting/test/SettingServiceTest'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { UpdateSetting } from '../UpdateSetting'

export class UpdateSettingTest {
  static makeSubject({
    settings = [],
    settingService = SettingServiceTest.makeSubject({ settings }),
    projector = SettingProjectorTest.get(),
    userRepository,
  }: {
    settings?: Setting[],
    settingService?: SettingService,
    projector?: SettingProjector,
    userRepository: UserRepositoryInterface,
  }): UpdateSetting {
    const logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()

    return new UpdateSetting(
      settingService,
      projector,
      userRepository,
      logger
    )
  }
}
