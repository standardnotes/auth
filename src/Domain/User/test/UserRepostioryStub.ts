import { User } from '../User'
import { UserRepositoryInterface } from '../UserRepositoryInterface'

export class UserRepostioryStub implements UserRepositoryInterface {
  constructor(
    private users: User[]
  ) {
  }

  async findOneByUuid(uuid: string): Promise<User | undefined> {
    for (const user of this.users) {
      if (user.uuid === uuid) {
        return user
      }
    }

    return undefined
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users) {
      if (user.email === email) {
        return user
      }
    }

    return undefined
  }

  async save(user: User): Promise<User> {
    this.users.push(user)

    return user
  }
}
