import 'reflect-metadata'
import { SettingTest } from '../Domain/Setting/test/SettingTest'
import { UserTest } from '../Domain/User/test/UserTest'
import { SettingProjector } from './SettingProjector'

describe('SettingProjector', () => {
  const userProps = {
    uuid: 'user-uuid',
  }
  const settingProps = {
    uuid: 'setting-uuid',
    name: 'setting-name',
    value: 'setting-value',
  }
  const setting = SettingTest.makeSubject(
    settingProps, 
    UserTest.makeSubject(userProps),
  )

  const expectedProjection = settingProps

  const createProjector = () => new SettingProjector()

  it('should create a simple projection of a setting', async () => {
    const projection = await createProjector().projectSimple(setting)
    expect(projection).toEqual(expectedProjection)
  })
  it('should create a simple projection of list of settings', async () => {
    const projection = await createProjector().projectManySimple([setting])
    expect(projection).toEqual([expectedProjection])
  })
})
