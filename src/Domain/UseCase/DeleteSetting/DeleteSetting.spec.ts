import 'reflect-metadata'
import { UserTest } from '../../User/test/UserTest'
import { DeleteSettingDto } from './DeleteSettingDto'
import { DeleteSettingTest } from './test/DeleteSettingTest'

describe('DeleteSetting', () => {
  const user = UserTest.makeWithSettings()
  const userUuid = user.uuid
  const getSettings = async () => user.settings
  const execute = async (dto: DeleteSettingDto) => await DeleteSettingTest
    .makeSubject({
      settings: await getSettings(),
    }).execute(dto)

  it('should delete a setting if it exists', async () => {
    const settings = await getSettings()
    const setting = settings[0]
    const settingName = setting.name
    const actual = await execute({
      userUuid,
      settingName,
    })

    expect(actual).toEqual({
      success: true,
      userUuid,
      settingName,
    })
  })

  it('should fail to delete a setting if it does not exist', async () => {
    const settingName = 'BAD'
    const actual = await execute({
      userUuid,
      settingName,
    })

    expect(actual).toMatchObject({
      success: false,
    })
  })
})
