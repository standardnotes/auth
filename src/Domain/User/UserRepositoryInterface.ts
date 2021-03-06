import { User } from './User'

export interface UserRepositoryInterface {
  findOneByUuid(uuid: string): Promise<User | undefined>
  findOneByEmail(email: string): Promise<User | undefined>
  save(user: User): Promise<User>
  remove(user: User): Promise<User>
}
