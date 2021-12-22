import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { Role } from '../../Domain/Role/Role'
import { RoleRepositoryInterface } from '../../Domain/Role/RoleRepositoryInterface'

@injectable()
@EntityRepository(Role)
export class MySQLRoleRepository extends Repository<Role> implements RoleRepositoryInterface {
  async findOneByName(name: string): Promise<Role | undefined> {
    const roles = await this.createQueryBuilder('role')
      .where('role.name = :name', { name })
      .orderBy('version', 'DESC')
      .cache(`role_${name}`, 600000)
      .take(1)
      .getMany()

    return roles.shift()
  }
}
