import 'reflect-metadata'

import { FileRemovedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { FileRemovedEventHandler } from './FileRemovedEventHandler'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

describe('FileRemovedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let logger: Logger
  let user: User
  let event: FileRemovedEvent
  let settingService: SettingServiceInterface

  const createHandler = () => new FileRemovedEventHandler(
    userRepository,
    settingService,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByUuid = jest.fn().mockReturnValue(user)

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.findSettingWithDecryptedValue = jest.fn().mockReturnValue(undefined)
    settingService.createOrReplace = jest.fn()

    event = {} as jest.Mocked<FileRemovedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userUuid: '1-2-3',
      fileByteSize: 123,
      filePath: '1-2-3/2-3-4',
      fileName: '2-3-4',
    }

    logger = {} as jest.Mocked<Logger>
    logger.warn = jest.fn()
  })

  it('should do nothing a bytes used setting does not exist', async () => {
    await createHandler().handle(event)

    expect(settingService.createOrReplace).not.toHaveBeenCalled()
  })

  it('should not do anything if a user is not found', async () => {
    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(settingService.createOrReplace).not.toHaveBeenCalled()
  })

  it('should update a bytes used setting', async () => {
    settingService.findSettingWithDecryptedValue = jest.fn().mockReturnValue({
      value: 345,
    })
    await createHandler().handle(event)

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props:  {
        name: 'FILE_UPLOAD_BYTES_USED',
        sensitive: false,
        unencryptedValue: '222',
      },
      user:  {
        uuid: '123',
      },
    })
  })
})
