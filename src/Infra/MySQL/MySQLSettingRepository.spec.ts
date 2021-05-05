import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'
import { Setting } from '../../Domain/Setting/Setting'
import { SettingFactoryTest } from '../../Domain/Setting/test/SettingFactoryTest'
import { SettingTest } from '../../Domain/Setting/test/SettingTest'
import { UserTest } from '../../Domain/User/test/UserTest'

import { MySQLSettingRepository } from './MySQLSettingRepository'

describe('MySQLSettingRepository', () => {
  let repository: MySQLSettingRepository
  let queryBuilder: SelectQueryBuilder<Setting>
  let setting: Setting

  const makeSubject = () => {
    return new MySQLSettingRepository()
  }

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<Setting>>

    setting = {} as jest.Mocked<Setting>

    repository = makeSubject()
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

  it('should find all by user uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()

    const settings = [setting]
    queryBuilder.getMany = jest.fn().mockReturnValue(settings)

    const userUuid = '123'
    const result = await repository.findAllByUserUuid(userUuid)

    expect(queryBuilder.where).toHaveBeenCalledWith('setting.user_uuid = :user_uuid', { user_uuid: userUuid })
    expect(result).toEqual(settings)
  })

  it('should create setting if it doesn\'t exist', async () => {
    const repository = makeSubject()
    const user = UserTest.makeSubject({})
    Object.assign(repository, {
      findOneByNameAndUserUuid: async () => undefined,
      save: (async () => undefined),
    })

    const result = await repository.createOrReplace({
      user: user,
      props: {
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 999,
      },
    }, SettingFactoryTest.makeSubject())

    expect(result).toEqual('created')
  })
  it('should replace setting if it does exist', async () => {
    const repository = makeSubject()
    const user = UserTest.makeSubject({})
    Object.assign(repository, {
      findOneByNameAndUserUuid: async () => SettingTest.makeSubject({}, user),
      save: (async () => undefined),
    })

    const result = await repository.createOrReplace({
      user: user,
      props: {
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 999,
      },
    }, SettingFactoryTest.makeSubject())

    expect(result).toEqual('replaced')
  })

  it('should delete setting if it does exist', async () => {
    const queryBuilder = {
      delete: () => queryBuilder,
      where: () => queryBuilder,
      execute: () => undefined,
    }
    const repository = Object.assign(makeSubject(), {
      createQueryBuilder: () => queryBuilder,
    })
    const result = await repository.deleteByUserUuid({
      userUuid: 'userUuid',
      settingName: 'settingName',
    })

    expect(result).toEqual(undefined)
  })
})
