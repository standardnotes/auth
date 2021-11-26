import { ReadStream } from 'fs'
import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'

import { User } from '../../Domain/User/User'
import { UserRepositoryInterface } from '../../Domain/User/UserRepositoryInterface'

@injectable()
@EntityRepository(User)
export class MySQLUserRepository extends Repository<User> implements UserRepositoryInterface {
  async streamAll(): Promise<ReadStream> {
    return this.createQueryBuilder('user').stream()
  }

  async findOneByUuid(uuid: string): Promise<User | undefined> {
    return this.createQueryBuilder('user')
      .where('user.uuid = :uuid', { uuid })
      .cache(`user_uuid_${uuid}`, 60000)
      .getOne()
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .cache(`user_email_${email}`, 60000)
      .getOne()
  }
}
