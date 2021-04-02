import { KeyParams } from '../KeyParams'

export class KeyParamsTest {
  static makeSubject(
    props: Partial<KeyParams>
  ): KeyParams {
    const defaults: KeyParams = {
      version: '004',
      identifier: 'test@test.com',
      created: new Date(1).toString(),
      pw_nonce: 'test',
    }

    Object.assign(defaults, props)

    return defaults
  }
}
