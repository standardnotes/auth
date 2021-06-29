import 'reflect-metadata'
import { UserTest } from '../../User/test/UserTest'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { UpdateSettingTest } from './test/UpdateSettingTest'
import { UpdateSettingResponse } from './UpdateSettingResponse'

describe('UpdateSetting', () => {
  const makeSubject = async () => UpdateSettingTest.makeSubject({
    settings: await getSettings(),
    userRepository: userRepositoryMock,
  })

  const user = UserTest.makeWithSettings()
  const userUuid = user.uuid

  const userRepositoryMock = {
    findOneByUuid: jest.fn().mockReturnValue(user),
  } as unknown as UserRepositoryInterface

  const getSettings = async () => (await user.settings)
  const getSetting = async () => (await getSettings())[0]

  it('should create a setting for a valid user uuid if it does not exist', async () => {
    const props = {
      name: 'test-setting-name',
      value: 'test-setting-value',
    }

    const subject = await makeSubject()
    const actual: UpdateSettingResponse = await subject.execute({ props, userUuid })

    expect(actual).toEqual({
      success: true,
      setting: {
        name: 'test-setting-name',
        uuid: expect.any(String),
        value: 'test-setting-value',
      },
      statusCode: 201,
    })
  })

  it('should replace a setting for a valid user uuid if it does exist', async () => {
    const setting = await getSetting()
    const props = {
      name: setting.name,
      value: 'REPLACED',
    }

    const subject = await makeSubject()
    const actual: UpdateSettingResponse = await subject.execute({
      userUuid,
      props,
    })

    expect(actual).toEqual({
      success: true,
      setting: {
        name: 'setting-1-name',
        uuid: expect.any(String),
        value: 'REPLACED',
      },
      statusCode: 204,
    })
  })
})
