import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Setting } from './Setting'
import { SettingDecrypterInterface } from './SettingDecrypterInterface'
import { SubscriptionSetting } from './SubscriptionSetting'

@injectable()
export class SettingDecrypter implements SettingDecrypterInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
  ) {
  }

  async decryptSettingValue(setting: Setting | SubscriptionSetting, userUuid: string): Promise<string | null> {
    if (setting.value !== null && setting.serverEncryptionVersion === EncryptionVersion.Default) {
      const user = await this.userRepository.findOneByUuid(userUuid)

      if (user === undefined) {
        throw new Error(`Could not find user with uuid: ${userUuid}`)
      }

      return this.crypter.decryptForUser(setting.value, user)
    }

    return setting.value
  }

}
