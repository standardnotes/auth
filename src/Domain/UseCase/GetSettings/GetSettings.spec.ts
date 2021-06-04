import 'reflect-metadata'

import { SettingProjectorTest } from '../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../Setting/Setting'
import { SETTINGS } from '../../Setting/Settings'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { UserTest } from '../../User/test/UserTest'
import { GetSettingsTest } from './test/GetSettingsTest'

describe('GetSettings', () => {
  let user = UserTest.makeWithSettings()
  const userUuid = user.uuid

  const projector = SettingProjectorTest.get()

  let settings: Setting[]
  let simpleSettings: SimpleSetting[]

  beforeAll(async () => {
    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)
  })

  const makeSubject = () => GetSettingsTest.makeSubject({
    settings,
    projector,
  })

  it('should get associated settings for a valid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid })

    expect(actual.userUuid).toEqual(userUuid)
    expect(actual.settings).toEqual(simpleSettings)
  })

  it('should prevent mfa secret from being retrieved with all settings', async () => {
    user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-1-uuid', name: 'setting-1-name' },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: SETTINGS.MFA_SECRET },
      ],
    })
    settings = await user.settings
    settings.pop()
    simpleSettings = await projector.projectManySimple(settings)

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
