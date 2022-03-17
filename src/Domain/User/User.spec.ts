import { User } from './User'

describe('User', () => {
  const createUser = () => new User()

  it('should indicate if support sessions', () => {
    const user = createUser()
    user.version = '004'

    expect(user.supportsSessions()).toBeTruthy()
  })

  it('should indicate if does not support sessions', () => {
    const user = createUser()
    user.version = '003'

    expect(user.supportsSessions()).toBeFalsy()
  })

  it('should indicate if the user is potentially a vault account', () => {
    const user = createUser()
    user.email = 'asdasdasdasdasdasdasdasdasdasdas'

    expect(user.isPotentiallyAVaultAccount()).toBeTruthy()
  })

  it('should indicate if the user is not a vault account', () => {
    const user = createUser()
    user.email = 'test@test.te'

    expect(user.isPotentiallyAVaultAccount()).toBeFalsy()
  })
})
