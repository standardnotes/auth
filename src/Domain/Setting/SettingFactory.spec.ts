import 'reflect-metadata'
import { UserTest } from '../User/test/UserTest'
import { SettingFactoryTest } from './test/SettingFactoryTest'

describe('SettingFactory', () => {
  it('should create a Setting', async () => {
    const props = {
      name: 'name',
      value: 'value',
    }
    const actual = await SettingFactoryTest.makeSubject()
      .create(props, UserTest.makeSubject({}))

    expect(actual).toMatchObject(props)
  })
})
