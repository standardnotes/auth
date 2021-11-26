import 'reflect-metadata'

import { ReadStream } from 'fs'

import { SelectQueryBuilder } from 'typeorm'
import { User } from '../../Domain/User/User'

import { MySQLUserRepository } from './MySQLUserRepository'

describe('MySQLUserRepository', () => {
  let repository: MySQLUserRepository
  let queryBuilder: SelectQueryBuilder<User>
  let user: User

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<User>>
    queryBuilder.cache = jest.fn().mockReturnThis()

    user = {} as jest.Mocked<User>

    repository = new MySQLUserRepository()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one user by id', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(user)

    const result = await repository.findOneByUuid('123')

    expect(queryBuilder.where).toHaveBeenCalledWith('user.uuid = :uuid', { uuid: '123' })
    expect(result).toEqual(user)
  })

  it('should stream all users', async () => {
    const stream = {} as jest.Mocked<ReadStream>
    queryBuilder.stream = jest.fn().mockReturnValue(stream)

    const result = await repository.streamAll()

    expect(result).toEqual(stream)
  })

  it('should find one user by email', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(user)

    const result = await repository.findOneByEmail('test@test.te')

    expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', { email: 'test@test.te' })
    expect(result).toEqual(user)
  })
})
