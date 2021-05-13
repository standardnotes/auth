import { MfaSetting } from '@standardnotes/auth'
import 'reflect-metadata'
import { UserTest } from '../../User/test/UserTest'
import { User } from '../../User/User'
import { GetAuthMethodsDto } from './GetAuthMethodsDto'
import { GetAuthMethodsTest } from './test/GetAuthMethodsTest'

describe('GetAuthMethods', () => {
  const execute = async (user: User, dto: GetAuthMethodsDto) => GetAuthMethodsTest.makeSubject({
    users: [user],
    settings: await user.settings,
  }).execute(dto)

  it('should return real methods for valid user email when MFA enabled', async () => {
    const mfaSecretUuid = 'mfa-secret-uuid'
    const user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: mfaSecretUuid, name: MfaSetting.MfaSecret, value: 'mfa-secret' },
      ],
    })

    const actual = await execute(user, { email: user.email })

    expect(actual).toEqual({
      success: true,
      methods: {
        totp: true,
      },
    })
  })
  it('should return real methods for valid user email when MFA disabled', async () => {
    const user = UserTest.makeSubject({})

    const actual = await execute(user, { email: user.email })

    expect(actual).toEqual({
      success: true,
      methods: {},
    })
  })
  it('should return fake methods for invalid user email', async () => {
    const user = UserTest.makeSubject({})

    const actual = await execute(user, { email: 'INVALID' })

    expect(actual).toEqual({
      success: true,
      methods: {},
    })
  })
})
