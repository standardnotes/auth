import 'reflect-metadata'
import { Setting } from '../../Setting/Setting'
import { SettingRepostioryStub } from '../../Setting/test/SettingRepositoryStub'
import { UserTest } from '../../User/test/UserTest'
import { GetSettings } from './GetSettings'

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

  let settings: Setting[]
  beforeAll(async () => {
    settings = await user.settings
  })

  const makeSubject = () => new GetSettings(
    new SettingRepostioryStub(settings),
  )

  it('should get associated settings for a valid user uuid', async () => {
    const actual = await makeSubject().execute({ userUuid })

    expect(actual.userUuid).toEqual(userUuid)
    expect(actual.settings).toEqual(settings)
  })

  it('should get empty settings for an invalid user uuid', async () => {
    const badUserUuid = 'BAD-user-uuid'
    const actual = await makeSubject().execute({ userUuid: badUserUuid })

    expect(actual.userUuid).toEqual(badUserUuid)
    expect(actual.settings).toEqual([])
  })
})
