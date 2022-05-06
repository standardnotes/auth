import { inject, injectable } from 'inversify'
import { Repository } from 'typeorm'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'
import { Role } from '../../Domain/Role/Role'
import { RoleRepositoryInterface } from '../../Domain/Role/RoleRepositoryInterface'

@injectable()
export class MySQLRoleRepository implements RoleRepositoryInterface {
  constructor(
    @inject(TYPES.ORMRoleRepository)
    private ormRepository: Repository<Role>,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async findOneByName(name: string): Promise<Role | null> {
    const roles = await this.ormRepository
      .createQueryBuilder('role')
      .where('role.name = :name', { name })
      .orderBy('version', 'DESC')
      .cache(`role_${name}`, 600000)
      .take(1)
      .getMany()

    this.logger.debug('[Repository] Found roles %O', roles)

    if (roles.length === 0) {
      return null
    }

    return roles.shift() as Role
  }
}
