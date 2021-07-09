import 'reflect-metadata'
import { Setting } from '../../Setting/Setting'
import { UserTest } from '../../User/test/UserTest'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UpdateSettingTest } from './test/UpdateSettingTest'
import { UpdateSettingResponse } from './UpdateSettingResponse'

describe('UpdateSetting', () => {
  let setting: Setting

  let getSettings = async () => (await user.settings)

  const user = UserTest.makeWithSettings()

  beforeEach(() => {
    setting = {
      user: Promise.resolve(user),
    } as jest.Mocked<Setting>
  })

  const makeSubject = async () => UpdateSettingTest.makeSubject({
    settings: await getSettings(),
    userRepository: userRepositoryMock,
  })


  const userUuid = user.uuid

  const userRepositoryMock = {
    findOneByUuid: jest.fn().mockReturnValue(user),
  } as unknown as UserRepositoryInterface

  it('should create a setting for a valid user uuid if it does not exist', async () => {
    const props = {
      name: 'test-setting-name',
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
    }

    const subject = await makeSubject()
    const actual: UpdateSettingResponse = await subject.execute({ props, userUuid })

    expect(actual).toEqual({
      success: true,
      setting: expect.any(Object),
      statusCode: 201,
    })
  })

  it('should create an encrypted setting for a valid user uuid if it does not exist', async () => {
    const props = {
      name: 'test-setting-name',
      value: 'test-setting-value',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    }

    const subject = await makeSubject()
    const actual: UpdateSettingResponse = await subject.execute({ props, userUuid })

    expect(actual).toEqual({
      success: true,
      setting: expect.any(Object),
      statusCode: 201,
    })
  })

  it('should replace a setting for a valid user uuid if it does exist', async () => {
    getSettings = async () => ([ setting ])

    const props = {
      name: setting.name,
      value: 'REPLACED',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
    }

    const subject = await makeSubject()
    const actual: UpdateSettingResponse = await subject.execute({
      userUuid,
      props,
    })

    expect(actual).toEqual({
      success: true,
      setting: expect.any(Object),
      statusCode: 200,
    })
  })

  it('should replace an encrypted setting for a valid user uuid if it does exist', async () => {
    getSettings = async () => ([ setting ])

    const props = {
      name: setting.name,
      value: 'REPLACED',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    }

    const subject = await makeSubject()
    const actual: UpdateSettingResponse = await subject.execute({
      userUuid,
      props,
    })

    expect(actual).toEqual({
      success: true,
      setting: expect.any(Object),
      statusCode: 200,
    })
  })
})
