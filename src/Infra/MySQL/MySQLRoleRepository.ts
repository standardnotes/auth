import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { Role } from '../../Domain/Role/Role'
import { RoleRepositoryInterface } from '../../Domain/Role/RoleRepositoryInterface'

@injectable()
@EntityRepository(Role)
export class MySQLRoleRepository extends Repository<Role> implements RoleRepositoryInterface {
  async findOneByName(name: string): Promise<Role | undefined> {
    return this.createQueryBuilder('role')
      .where('role.name = :name', { name })
      .cache(`role_${name}`, 600000)
      .getOne()
  }

  async findAllByNames(names: string[]): Promise<Role[] | undefined> {
    return this.createQueryBuilder('role')
      .where('role.name in (:names)', { names })
      .getMany()
  }
}
