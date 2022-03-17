import 'reflect-metadata'

import { FileUploadedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { FileUploadedEventHandler } from './FileUploadedEventHandler'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'

describe('FileUploadedEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let logger: Logger
  let user: User
  let event: FileUploadedEvent
  let settingService: SettingServiceInterface

  const createHandler = () => new FileUploadedEventHandler(
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

    event = {} as jest.Mocked<FileUploadedEvent>
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

  it('should create a bytes used setting if one does not exist', async () => {
    await createHandler().handle(event)

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props:  {
        name: 'FILE_UPLOAD_BYTES_USED',
        sensitive: false,
        unencryptedValue: '123',
      },
      user:  {
        uuid: '123',
      },
    })
  })

  it('should not do anything if a user is not found', async () => {
    userRepository.findOneByUuid = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(settingService.createOrReplace).not.toHaveBeenCalled()
  })

  it('should update a bytes used setting if one does exist', async () => {
    settingService.findSettingWithDecryptedValue = jest.fn().mockReturnValue({
      value: 345,
    })
    await createHandler().handle(event)

    expect(settingService.createOrReplace).toHaveBeenCalledWith({
      props:  {
        name: 'FILE_UPLOAD_BYTES_USED',
        sensitive: false,
        unencryptedValue: '468',
      },
      user:  {
        uuid: '123',
      },
    })
  })
})
