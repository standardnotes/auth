import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'
import { Role } from '../../Domain/Role/Role'

import { MySQLRoleRepository } from './MySQLRoleRepository'

describe('MySQLRoleRepository', () => {
  let repository: MySQLRoleRepository
  let queryBuilder: SelectQueryBuilder<Role>
  let role: Role

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<Role>>
    queryBuilder.cache = jest.fn().mockReturnThis()

    role = {} as jest.Mocked<Role>

    repository = new MySQLRoleRepository()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one role by name', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(role)

    const result = await repository.findOneByName('test')

    expect(queryBuilder.where).toHaveBeenCalledWith('role.name = :name', { name: 'test' })
    expect(result).toEqual(role)
  })
})
