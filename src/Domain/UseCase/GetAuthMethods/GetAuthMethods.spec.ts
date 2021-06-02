import 'reflect-metadata'
import { SETTINGS } from '../../Setting/Settings'
import { UserTest } from '../../User/test/UserTest'
import { User } from '../../User/User'
import { GetAuthMethodsDto } from './GetAuthMethodsDto'
import { GetAuthMethodsTest } from './test/GetAuthMethodsTest'

describe('GetAuthMethods', () => {
  const mfaSecretUuid = 'mfa-secret-uuid'
  let user: User

  const execute = async (dto: GetAuthMethodsDto) => GetAuthMethodsTest.makeSubject({
    users: [user],
    settings: await user.settings,
  }).execute(dto)

  beforeEach(() => {
    user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: mfaSecretUuid, name: SETTINGS.MFA_SECRET, value: 'mfa-secret' },
      ],
    })
  })

  it('should return real methods for valid user email', async () => {
    const actual = await execute({ email: user.email })

    expect(actual).toEqual({
      success: true,
      methods: {
        totp: true,
      },
    })
  })

  it('should not return totp methods if setting is reset', async () => {
    user = UserTest.makeSubject({
      uuid: 'user-with-settings-uuid',
    }, {
      settings: [
        { uuid: mfaSecretUuid, name: SETTINGS.MFA_SECRET, value: '' },
      ],
    })

    const actual = await execute({ email: user.email })

    expect(actual).toEqual({
      success: true,
      methods: {},
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
