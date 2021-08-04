import { Role } from './Role'

export interface RoleRepositoryInterface {
  findOneByName(name: string): Promise<Role | undefined>
  findAllByNames(names: string[]): Promise<Role[] | undefined>
}
