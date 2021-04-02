import { KeyParams } from '../KeyParams'
import { KeyParamsFactoryInterface } from '../KeyParamsFactoryInterface'
import { User } from '../User'

export class KeyParamsFactoryStub implements KeyParamsFactoryInterface {
  constructor(
    private keyParams: KeyParams
  ) {
  }

  create(_user: User, _authenticated: boolean): KeyParams {
    return this.keyParams
  }

  createPseudoParams(_email: string): KeyParams {
    return this.keyParams
  }

}
