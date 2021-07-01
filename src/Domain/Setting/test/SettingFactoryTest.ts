import { TimerInterface } from '@standardnotes/time'
import { CrypterTest } from '../../Encryption/test/CrypterTest'
import { SettingFactory } from '../SettingFactory'

export class SettingFactoryTest {
  static makeSubject(): SettingFactory {
    const timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(1)

    return new SettingFactory(
      CrypterTest.makeSubject(),
      timer,
    )
  }
}
