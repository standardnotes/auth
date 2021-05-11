import 'reflect-metadata'
import { UserTest } from '../User/test/UserTest'
import { SettingPersisterTest } from './test/SettingPersisterTest'
import { SettingTest } from './test/SettingTest'

describe('SettingPersister', () => {
  it('should create setting if it doesn\'t exist', async () => {
    const persister = SettingPersisterTest.makeSubject()
    const user = UserTest.makeSubject({})

    const result = await persister.createOrReplace({
      user: user,
      props: {
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result).toEqual('created')
  })
  it('should replace setting if it does exist', async () => {
    const user = UserTest.makeSubject({})
    const setting = SettingTest.makeSubject({}, user)
    const persister = SettingPersisterTest.makeSubject({
      settings: [setting],
    })

    const result = await persister.createOrReplace({
      user: user,
      props: {
        ...setting,
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result).toEqual('replaced')
  })
})
