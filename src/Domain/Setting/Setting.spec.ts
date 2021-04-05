import 'reflect-metadata'
import { UserTest } from '../User/test/UserTest'
import { Setting } from './Setting'

describe('Setting', () => {
  it('should create a Setting', async () => {
    const props = {
      name: 'name', 
      value: 'value',
    }
    const actual = Setting.create(props, UserTest.makeSubject({}))

    expect(actual).toMatchObject(props)
  })
})
