import 'reflect-metadata'
import { SettingProjectorTest } from '../../../Projection/test/SettingProjectorTest'
import { Setting } from '../../Setting/Setting'
import { SimpleSetting } from '../../Setting/SimpleSetting'
import { UserTest } from '../../User/test/UserTest'
import { User } from '../../User/User'
import { GetMFASettingTest } from './test/GetMFASettingTest'

describe('GetMFASetting', () => {
  let user: User
  let userUuid: string
  const settingIndex = 0

  const projector = SettingProjectorTest.get()

  let settings: Setting[]
  let simpleSettings: SimpleSetting[]

  const makeSubject = () => GetMFASettingTest.makeSubject({
    users: [ user ],
    settings,
    projector,
  })

  beforeEach(async () => {
    user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-2-uuid', name: 'MFA_SECRET', serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: 'setting-3-name' },
      ],
    })
    userUuid = user.uuid

    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)
  })

  it('should get an mfa setting with a valid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid })

    expect(actual).toEqual({
      success: true,
      userUuid,
      setting: simpleSettings[settingIndex],
    })
  })

  it('should get a decrypted mfa setting with a valid user uuid', async () => {
    user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-2-uuid', name: 'MFA_SECRET' },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: 'setting-3-name' },
      ],
    })

    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)

    const actual = await makeSubject().execute({ userUuid })

    expect(actual).toEqual({
      success: true,
      userUuid,
      setting: {
        createdAt: 1,
        name: 'MFA_SECRET',
        updatedAt: 1,
        uuid: 'setting-2-uuid',
        value: 'decrypted',
      },
    })
  })

  it('should fail for invalid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid: 'BAD' })

    expect(actual.success).toEqual(false)
  })

  it('should fail for not found user uuid', async () => {
    user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: 'setting-2-uuid', name: 'MFA_SECRET' },
        { uuid: 'setting-2-uuid', name: 'setting-2-name' },
        { uuid: 'setting-3-uuid', name: 'setting-3-name' },
      ],
    })

    settings = await user.settings
    simpleSettings = await projector.projectManySimple(settings)

    const subject = GetMFASettingTest.makeSubject({
      users: [],
      settings,
      projector,
    })

    const actual = await subject.execute({ userUuid })

    expect(actual.success).toEqual(false)
  })
})
