import { MfaSetting } from '@standardnotes/auth'
import 'reflect-metadata'
import { UserTest } from '../../User/test/UserTest'
import { GetAuthMethodsDto } from './GetAuthMethodsDto'
import { GetAuthMethodsTest } from './test/GetAuthMethodsTest'

describe('GetAuthMethods', () => {
  const mfaSecretUuid = 'mfa-secret-uuid'
  const user = UserTest.makeSubject({
    uuid: 'user-with-settings-uuid',
  }, {
    settings: [
      { uuid: mfaSecretUuid, name: MfaSetting.MfaSecret, value: 'mfa-secret' },
    ],
  })
  const execute = async (dto: GetAuthMethodsDto) => GetAuthMethodsTest.makeSubject({
    users: [user],
    settings: await user.settings,
  }).execute(dto)

  it('should return real methods for valid user email', async () => {
    const actual = await execute({ email: user.email })

    expect(actual).toEqual({
      success: true,
      methods: {
        totp: {
          mfaSecretUuid,
        },
      },
    })
  })
  it('should return fake methods for invalid user email', async () => {
    const actual = await execute({ email: 'INVALID' })

    expect(actual).toEqual({
      success: true,
      methods: {},
    })
  })
})
