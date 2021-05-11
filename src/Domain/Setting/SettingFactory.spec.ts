import 'reflect-metadata'
import { UserTest } from '../User/test/UserTest'
import { SettingProps } from './SettingProps'
import { SettingFactoryTest } from './test/SettingFactoryTest'

describe('SettingFactory', () => {
  it('should create a Setting', async () => {
    const props: SettingProps = {
      name: 'name',
      value: 'value',
    }
    const actual = await SettingFactoryTest.makeSubject()
      .create(props, UserTest.makeSubject({}))

    expect(actual).toMatchObject(props)
  })
  it('should create an encrypted Setting', async () => {
    const value = 'value'
    const props: SettingProps = {
      name: 'name',
      value,
      serverEncryptionVersion: 1,
    }
    const { value: _, ...propsExceptValue } = props
    const actual = await SettingFactoryTest.makeSubject()
      .create(props, UserTest.makeSubject({}))

    expect(actual).toMatchObject(propsExceptValue)
    expect(actual.value).not.toBe(value)
  })
  it('should throw for unrecognized encryption version', async () => {
    const value = 'value'
    const props: SettingProps = {
      name: 'name',
      value,
      serverEncryptionVersion: 99999999999,
    }

    await expect(async () => await SettingFactoryTest.makeSubject()
      .create(props, UserTest.makeSubject({}))).rejects.toThrow()
  })
})
