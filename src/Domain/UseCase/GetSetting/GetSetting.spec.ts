import 'reflect-metadata'
import { SettingProjectorTest } from '../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../Setting/Setting'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { userWithSettings } from '../../User/test/data'
import { UserTest } from '../../User/test/UserTest'
import { GetSettingTest } from './test/GetSettingTest'

describe('GetSetting', () => {
  const user = UserTest.makeSubject({ 
    uuid: 'user-with-settings-uuid',
  }, {
    settings: [
      { uuid: 'setting-1', name: 'setting-name-1' },
      { uuid: 'setting-2', name: 'setting-name-2' },
    ]
  })
  const userUuid = userWithSettings.uuid

  const projector = SettingProjectorTest.get()

  let settings: Setting[]
  let simpleSettings: SimpleSetting[]
  let settingName: string
  beforeAll(async () => {
    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)
    settingName = simpleSettings[0].name
  })

  const makeSubject = () => GetSettingTest.makeSubject({
    settings,
    projector,
  })

  it('should get a setting by name associated with a valid user uuid', async () => {
    const actual = await makeSubject().execute({ settingName, userUuid })

    expect(actual).toEqual({
      success: true,
      userUuid,
      setting: simpleSettings[0]
    })
  })
  
  it('should fail for invalid setting name', async () => {
    const actual = await makeSubject().execute({ settingName: 'BAD', userUuid })

    expect(actual.success).toEqual(false)
  })

  it('should fail for invalid user uuid', async () => {
    const actual = await makeSubject().execute({ settingName, userUuid: 'BAD' })

    expect(actual.success).toEqual(false)
  })
})
