import { ReadStream } from 'fs'
import { User } from './User'

export interface UserRepositoryInterface {
  streamAll(): Promise<ReadStream>
  findOneByUuid(uuid: string): Promise<User | undefined>
  findOneByEmail(email: string): Promise<User | undefined>
  save(user: User): Promise<User>
  remove(user: User): Promise<User>
}
