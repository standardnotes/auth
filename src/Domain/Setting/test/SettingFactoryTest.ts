import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { CrypterNode } from '../../Encryption/CrypterNode'
import { SettingFactory } from '../SettingFactory'

export class SettingFactoryTest {
  static makeSubject(): SettingFactory {
    // todo: mock
    return new SettingFactory(
      new CrypterNode(
        'feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308',
        new SnCryptoNode(),
      ),
    )
  }
}
