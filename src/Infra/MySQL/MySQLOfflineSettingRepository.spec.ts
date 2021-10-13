import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'
import { OfflineSetting } from '../../Domain/Setting/OfflineSetting'
import { OfflineSettingName } from '../../Domain/Setting/OfflineSettingName'

import { MySQLOfflineSettingRepository } from './MySQLOfflineSettingRepository'

describe('MySQLOfflineSettingRepository', () => {
  let repository: MySQLOfflineSettingRepository
  let queryBuilder: SelectQueryBuilder<OfflineSetting>
  let offlineSetting: OfflineSetting

  const makeSubject = () => {
    return new MySQLOfflineSettingRepository()
  }

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<OfflineSetting>>

    offlineSetting = {} as jest.Mocked<OfflineSetting>

    repository = makeSubject()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one setting by name and user email', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(offlineSetting)

    const result = await repository.findOneByNameAndEmail(OfflineSettingName.FeaturesToken, 'test@test.com')

    expect(queryBuilder.where).toHaveBeenCalledWith('offline_setting.name = :name AND offline_setting.email = :email', { name: 'FEATURES_TOKEN', email: 'test@test.com' })
    expect(result).toEqual(offlineSetting)
  })

  it('should find one setting by name and value', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(offlineSetting)

    const result = await repository.findOneByNameAndValue(OfflineSettingName.FeaturesToken, 'features-token')

    expect(queryBuilder.where).toHaveBeenCalledWith('offline_setting.name = :name AND offline_setting.value = :value', { name: 'FEATURES_TOKEN', value: 'features-token' })
    expect(result).toEqual(offlineSetting)
  })
})
