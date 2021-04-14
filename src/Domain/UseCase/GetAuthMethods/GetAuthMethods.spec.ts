import 'reflect-metadata'
import { SETTINGS } from '../../Setting/Settings'
import { UserTest } from '../../User/test/UserTest'
import { GetAuthMethodsDto } from './GetAuthMethodsDto'
import { GetAuthMethodsTest } from './test/GetAuthMethodsTest'

describe('GetAuthMethods', () => {
  const totpUuid = 'totp-uuid'
  const user = UserTest.makeSubject({ 
    uuid: 'user-with-settings-uuid',
  }, {
    settings: [
      { uuid: totpUuid, name: SETTINGS.MFA_SECRET, value: 'mfa-secret' },
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
          uuid: totpUuid,
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
