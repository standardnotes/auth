import { CrypterInterface } from '../CrypterInterface'
import { CrypterStub } from './CrypterStub'

export class CrypterTest {
  static makeSubject(): CrypterInterface {
    return new CrypterStub()
  }
}
