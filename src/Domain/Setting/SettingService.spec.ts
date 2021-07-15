import 'reflect-metadata'
import { Logger } from 'winston'
import { User } from '../User/User'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'

import { SettingService } from './SettingService'

describe('SettingService', () => {
  let setting: Setting
  let user: User
  let factory: SettingFactory
  let repository: SettingRepositoryInterface
  let logger: Logger

  const createService = () => new SettingService(factory, repository, logger)

  beforeEach(() => {
    user = {} as jest.Mocked<User>

    setting = {} as jest.Mocked<Setting>

    factory = {} as jest.Mocked<SettingFactory>
    factory.create = jest.fn().mockReturnValue(setting)
    factory.createReplacement = jest.fn().mockReturnValue(setting)

    repository = {} as jest.Mocked<SettingRepositoryInterface>
    repository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(undefined)
    repository.save = jest.fn()

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it ('should create setting if it doesn\'t exist', async () => {
    const result = await createService().createOrReplace({
      user,
      props: {
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('created')
  })

  it ('should create setting with a given uuid if it does not exist', async () => {
    repository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    const result = await createService().createOrReplace({
      user,
      props: {
        uuid: '1-2-3',
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('created')
  })

  it ('should replace setting if it does exist', async () => {
    repository.findLastByNameAndUserUuid = jest.fn().mockReturnValue(setting)

    const result = await createService().createOrReplace({
      user: user,
      props: {
        ...setting,
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('replaced')
  })

  it ('should replace setting with a given uuid if it does exist', async () => {
    repository.findOneByUuid = jest.fn().mockReturnValue(setting)

    const result = await createService().createOrReplace({
      user: user,
      props: {
        ...setting,
        uuid: '1-2-3',
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('replaced')
  })
})
