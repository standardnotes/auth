import { CrypterTest } from '../../Encryption/test/CrypterTest'
import { SettingFactory } from '../SettingFactory'

export class SettingFactoryTest {
  static makeSubject(): SettingFactory {
    return new SettingFactory(
      CrypterTest.makeSubject()
    )
  }
}
