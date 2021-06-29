import 'reflect-metadata'
import { SettingProjectorTest } from '../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../Setting/Setting'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { UserTest } from '../../User/test/UserTest'
import { GetMFASettingTest } from './test/GetMFASettingTest'

describe('GetMFASetting', () => {
  const user = UserTest.makeSubject({
    uuid: 'user-with-settings-uuid',
  }, {
    settings: [
      { uuid: 'setting-2-uuid', name: 'MFA_SECRET' },
      { uuid: 'setting-2-uuid', name: 'setting-2-name' },
      { uuid: 'setting-3-uuid', name: 'setting-3-name' },
    ],
  })
  const userUuid = user.uuid
  const settingIndex = 0

  const projector = SettingProjectorTest.get()

  let settings: Setting[]
  let simpleSettings: SimpleSetting[]
  beforeEach(async () => {
    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)
  })

  const makeSubject = () => GetMFASettingTest.makeSubject({
    settings,
    projector,
  })

  it('should get an mfa setting with a valid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid })

    expect(actual).toEqual({
      success: true,
      userUuid,
      setting: simpleSettings[settingIndex],
    })
  })

  it('should fail for invalid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid: 'BAD' })

    expect(actual.success).toEqual(false)
  })
})
