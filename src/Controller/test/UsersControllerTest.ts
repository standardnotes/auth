import { SettingRepositoryInterface } from '../../Domain/Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../Domain/Setting/test/SettingRepositoryStub'
import { DeleteAccount } from '../../Domain/UseCase/DeleteAccount/DeleteAccount'
import { GetSettingTest } from '../../Domain/UseCase/GetSetting/test/GetSettingTest'
import { GetSettingsTest } from '../../Domain/UseCase/GetSettings/test/GetSettingsTest'
import { GetUserKeyParamsTest } from '../../Domain/UseCase/GetUserKeyParams/test/GetUserKeyParamsTest'
import { UpdateSettingTest } from '../../Domain/UseCase/UpdateSetting/test/UpdateSettingTest'
import { UpdateUser } from '../../Domain/UseCase/UpdateUser'
import { KeyParamsFactoryInterface } from '../../Domain/User/KeyParamsFactoryInterface'
import { KeyParamsFactoryStub } from '../../Domain/User/test/KeyParamsFactoryStub'
import { UserRepostioryStub } from '../../Domain/User/test/UserRepostioryStub'
import { UserRepositoryInterface } from '../../Domain/User/UserRepositoryInterface'
import { SettingProjector } from '../../Projection/SettingProjector'
import { SettingProjectorTest } from '../../Projection/test/SettingProjectorTest'
import { UsersController } from '../UsersController'

export class UsersControllerTest {
  static makeSubject({
    updateUser,
    deleteAccount,
    settingRepository = new SettingRepostioryStub([]),
    projector = SettingProjectorTest.get(),
    userRepository = new UserRepostioryStub([]),
    keyParamsFactory = new KeyParamsFactoryStub({ version: '004', identifier: 'test@test.com' }),
  }: {
    updateUser: UpdateUser,
    deleteAccount: DeleteAccount
    settingRepository?: SettingRepositoryInterface,
    projector?: SettingProjector,
    userRepository?: UserRepositoryInterface,
    keyParamsFactory?: KeyParamsFactoryInterface
  }): UsersController {
    return new UsersController(
      updateUser,
      GetSettingsTest.makeSubject({
        repository: settingRepository,
        projector,
      }),
      GetSettingTest.makeSubject({
        repository: settingRepository,
        projector,
      }),
      GetUserKeyParamsTest.makeSubject({
        repository: userRepository,
        keyParamsFactory,
      }),
      UpdateSettingTest.makeSubject({
        settingRepository,
        userRepository,
      }),
      deleteAccount,
    )
  }
}
