import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'
import { Setting } from '../../Domain/Setting/Setting'

import { MySQLSubscriptionSettingRepository } from './MySQLSubscriptionSettingRepository'

describe('MySQLSubscriptionSettingRepository', () => {
  let repository: MySQLSubscriptionSettingRepository
  let queryBuilder: SelectQueryBuilder<Setting>
  let setting: Setting

  const makeSubject = () => {
    return new MySQLSubscriptionSettingRepository()
  }

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<Setting>>

    setting = {} as jest.Mocked<Setting>

    repository = makeSubject()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one setting by uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(setting)

    const result = await repository.findOneByUuid('1-2-3')

    expect(queryBuilder.where).toHaveBeenCalledWith('setting.uuid = :uuid', { uuid: '1-2-3' })
    expect(result).toEqual(setting)
  })

  it('should find last setting by name and user uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.orderBy = jest.fn().mockReturnThis()
    queryBuilder.limit = jest.fn().mockReturnThis()
    queryBuilder.getMany = jest.fn().mockReturnValue([setting])

    const result = await repository.findLastByNameAndUserSubscriptionUuid('test', '1-2-3')

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'setting.name = :name AND setting.user_subscription_uuid = :userSubscriptionUuid',
      { name: 'test', userSubscriptionUuid: '1-2-3' },
    )
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('updated_at', 'DESC')
    expect(queryBuilder.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual(setting)
  })
})
