import 'reflect-metadata'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Setting } from '../../Setting/Setting'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { UserTest } from '../../User/test/UserTest'
import { GetSettingsTest } from './test/GetSettingsTest'

describe('GetSettings', () => {
  const userUuid = 'user-uuid'
  const user = UserTest.makeSubject({ 
    uuid: userUuid,
  }, {
    settings: [
      { uuid: 'setting-1' },
      { uuid: 'setting-2' },
    ]
  })

  const settingProjector = new SettingProjector()

  let settings: Setting[]
  let simpleSettings: SimpleSetting[]
  beforeAll(async () => {
    settings = await user.settings
    simpleSettings = await settingProjector.projectManySimple(settings)
  })

  const makeSubject = () => GetSettingsTest.makeSubject(settings, settingProjector)

  it('should get associated settings for a valid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid })

    expect(actual.userUuid).toEqual(userUuid)
    expect(actual.settings).toEqual(simpleSettings)
  })

  it('should get empty settings for an invalid user uuid', async () => {
    const badUserUuid = 'BAD-user-uuid'
    const actual = await makeSubject().execute({ userUuid: badUserUuid })

    expect(actual.userUuid).toEqual(badUserUuid)
    expect(actual.settings).toEqual([])
  })
})
