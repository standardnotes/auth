import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'
import { Setting } from '../../Domain/Setting/Setting'

import { MySQLSettingRepository } from './MySQLSettingRepository'

describe('MySQLSettingRepository', () => {
  let repository: MySQLSettingRepository
  let queryBuilder: SelectQueryBuilder<Setting>
  let setting: Setting

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<Setting>>

    setting = {} as jest.Mocked<Setting>

    repository = new MySQLSettingRepository()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one setting by name and user uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(setting)

    const result = await repository.findOneByNameAndUserUuid('test', '1-2-3')

    expect(queryBuilder.where).toHaveBeenCalledWith('setting.name = :name AND setting.user_uuid = :user_uuid', { name: 'test', user_uuid: '1-2-3' })
    expect(result).toEqual(setting)
  })
})
