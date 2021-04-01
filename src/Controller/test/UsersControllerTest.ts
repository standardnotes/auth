import { SettingRepositoryInterface } from '../../Domain/Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../Domain/Setting/test/SettingRepositoryStub'
import { GetSettingTest } from '../../Domain/UseCase/GetSetting/test/GetSettingTest'
import { GetSettingsTest } from '../../Domain/UseCase/GetSettings/test/GetSettingsTest'
import { UpdateUser } from '../../Domain/UseCase/UpdateUser'
import { SettingProjector } from '../../Projection/SettingProjector'
import { SettingProjectorTest } from '../../Projection/test/SettingProjectorTest'
import { UsersController } from '../UsersController'

export class UsersControllerTest {
  static makeSubject({
    updateUser,
    repository = new SettingRepostioryStub([]),
    projector = SettingProjectorTest.get(),
  }: {
    updateUser: UpdateUser,
    repository?: SettingRepositoryInterface,
    projector?: SettingProjector,
  }): UsersController {
    return new UsersController(
      updateUser,
      GetSettingsTest.makeSubject({
        repository,
        projector,
      }),
      GetSettingTest.makeSubject({
        repository,
        projector,
      })
    )
  }
}
