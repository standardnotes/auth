import { Setting } from '../../../Setting/Setting'
import { SettingRepositoryInterface } from '../../../Setting/SettingRepositoryInterface'
import { SettingRepostioryStub } from '../../../Setting/test/SettingRepositoryStub'
import { UserRepostioryStub } from '../../../User/test/UserRepostioryStub'
import { User } from '../../../User/User'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { GetAuthMethods } from '../GetAuthMethods'

export class GetAuthMethodsTest {
  static makeSubject({
    users = [],
    settings = [],
    settingRepository = new SettingRepostioryStub(settings),
    userRepository = new UserRepostioryStub(users),
  }: {
    users?: User[],
    settings?: Setting[],
    settingRepository?: SettingRepositoryInterface,
    userRepository?: UserRepositoryInterface,
  }): GetAuthMethods {
    return new GetAuthMethods(
      settingRepository,
      userRepository,
    )
  }
}
