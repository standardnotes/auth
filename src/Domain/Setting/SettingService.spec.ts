import 'reflect-metadata'
import { UserTest } from '../User/test/UserTest'
import { SettingServiceTest as SettingServiceTest } from './test/SettingServiceTest'
import { SettingTest } from './test/SettingTest'

describe('SettingService', () => {
  it ('should create setting if it doesn\'t exist', async () => {
    const persister = SettingServiceTest.makeSubject()
    const user = UserTest.makeSubject({})

    const result = await persister.createOrReplace({
      user: user,
      props: {
        name: 'name',
        value: 'value',
        serverEncryptionVersion: 1,
      },
    })

    expect(result.status).toEqual('created')
  })

  it ('should replace setting if it does exist', async () => {
    const user = UserTest.makeSubject({})
    const setting = SettingTest.makeSubject({}, user)
    const persister = SettingServiceTest.makeSubject({
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

    expect(result.status).toEqual('replaced')
  })
})
