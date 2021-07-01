import { SettingProjector } from '../../../../Projection/SettingProjector'
import { SettingProjectorTest } from '../../../../Projection/test/SettingProjectorTest'
import { CrypterInterface } from '../../../Encryption/CrypterInterface'
import { CrypterTest } from '../../../Encryption/test/CrypterTest'
import { Setting } from '../../../Setting/Setting'
import { SettingRepositoryInterface } from '../../../Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { UserRepostioryStub } from '../../../User/test/UserRepostioryStub'
import { User } from '../../../User/User'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { GetMFASetting } from '../GetMFASetting'

export class GetMFASettingTest {
  static makeSubject({
    settings = [],
    users = [],
    repository = new SettingRepostioryStub(settings),
    projector = SettingProjectorTest.get(),
    userRepository = new UserRepostioryStub(users),
    crypter = CrypterTest.makeSubject(),
  }: {
    settings?: Setting[],
    users?: User[],
    repository?: SettingRepositoryInterface,
    projector?: SettingProjector,
    userRepository?: UserRepositoryInterface,
    crypter?: CrypterInterface,
  } = {}): GetMFASetting {
    return new GetMFASetting(
      repository,
      projector,
      userRepository,
      crypter,
    )
  }
}
