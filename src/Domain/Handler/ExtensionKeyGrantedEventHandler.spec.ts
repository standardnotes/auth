import 'reflect-metadata'

import { ExtensionKeyGrantedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import * as dayjs from 'dayjs'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { ExtensionKeyGrantedEventHandler } from './ExtensionKeyGrantedEventHandler'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

describe('ExtensionKeyGrantedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let logger: Logger
  let user: User
  let event: ExtensionKeyGrantedEvent
  let settingService: SettingServiceInterface
  let timestamp: number

  const createHandler = () => new ExtensionKeyGrantedEventHandler(
    userRepository,
    settingService,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.createOrReplace = jest.fn()

    timestamp = dayjs.utc().valueOf()

    event = {} as jest.Mocked<ExtensionKeyGrantedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      extensionKey: 'abc123',
      timestamp,
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should add extension key as user setting', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'EXTENSION_KEY',
        serverEncryptionVersion: 1,
        value: 'abc123',
      },
      user: {
        uuid: '123',
      },
    })
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(settingService.createOrReplace).not.toHaveBeenCalled()
  })
})
