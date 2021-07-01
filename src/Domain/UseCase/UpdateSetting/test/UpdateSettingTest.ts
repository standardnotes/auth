import { Logger } from 'winston'
import { SettingProjector } from '../../../../Projection/SettingProjector'
import { SettingProjectorTest } from '../../../../Projection/test/SettingProjectorTest'
import { CrypterInterface } from '../../../Encryption/CrypterInterface'
import { CrypterTest } from '../../../Encryption/test/CrypterTest'
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
    crypter = CrypterTest.makeSubject(),
  }: {
    settings?: Setting[],
    settingService?: SettingService,
    projector?: SettingProjector,
    userRepository: UserRepositoryInterface,
    crypter?: CrypterInterface,
  }): UpdateSetting {
    const logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()

    return new UpdateSetting(
      settingService,
      projector,
      userRepository,
      crypter,
      logger
    )
  }
}
