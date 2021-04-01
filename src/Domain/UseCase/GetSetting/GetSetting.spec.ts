import 'reflect-metadata'
import { SettingProjectorTest } from '../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../Setting/Setting'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { userWithSettings } from '../../User/test/data'
import { GetSettingTest } from './test/GetSettingTest'

describe('GetSetting', () => {
  const user = userWithSettings
  const userUuid = user.uuid
  const settingIndex = 0

  const projector = SettingProjectorTest.get()

  let settings: Setting[]
  let simpleSettings: SimpleSetting[]
  let settingName: string
  beforeAll(async () => {
    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)
    settingName = simpleSettings[settingIndex].name
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
      setting: simpleSettings[settingIndex]
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
