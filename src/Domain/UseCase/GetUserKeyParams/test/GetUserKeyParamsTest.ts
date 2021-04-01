import { KeyParams } from '../../../User/KeyParams'
import { KeyParamsFactoryInterface } from '../../../User/KeyParamsFactoryInterface'
import { KeyParamsFactoryStub } from '../../../User/test/KeyParamsFactoryStub'
import { UserRepostioryStub } from '../../../User/test/UserRepostioryStub'
import { User } from '../../../User/User'
import { UserRepositoryInterface } from '../../../User/UserRepositoryInterface'
import { GetUserKeyParams } from '../GetUserKeyParams'

export class GetUserKeyParamsTest {
  static makeSubject({
    users = [],
    keyParams = { version: '004', identifier: 'test@test.com' },
    keyParamsFactory = new KeyParamsFactoryStub(keyParams),
    repository = new UserRepostioryStub(users)
  }: {
    users?: User[],
    keyParams?: KeyParams,
    keyParamsFactory?: KeyParamsFactoryInterface,
    repository?: UserRepositoryInterface,
  } = {}): GetUserKeyParams {
    return new GetUserKeyParams(
      keyParamsFactory,
      repository
    )
  }
}
