import { SubscriptionName } from '@standardnotes/auth'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { MuteFailedBackupsEmailsOption, SettingName } from '@standardnotes/settings'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'
import TYPES from '../../Bootstrap/Types'
import { CrypterInterface } from '../Encryption/CrypterInterface'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { CreateOrReplaceSettingDto } from './CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingResponse } from './CreateOrReplaceSettingResponse'
import { FindSettingDTO } from './FindSettingDTO'
import { Setting } from './Setting'
import { SettingFactory } from './SettingFactory'
import { SettingRepositoryInterface } from './SettingRepositoryInterface'
import { SettingServiceInterface } from './SettingServiceInterface'
import { SettingToSubscriptionMapInterface } from './SettingToSubscriptionMapInterface'

@injectable()
export class SettingService implements SettingServiceInterface {
  constructor(
    @inject(TYPES.SettingFactory) private factory: SettingFactory,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.SettingToSubscriptionMap) private settingToSubscriptionMap: SettingToSubscriptionMapInterface,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async applyDefaultSettingsForSubscription(user: User, subscriptionName: SubscriptionName): Promise<void> {
    const defaultSettingsWithValues = this.settingToSubscriptionMap.getDefaultSettingsAndValuesForSubscriptionName(subscriptionName)
    if (defaultSettingsWithValues === undefined) {
      this.logger.warn(`Could not find settings for subscription: ${subscriptionName}`)

      return
    }

    for (const settingName of defaultSettingsWithValues.keys()) {
      const setting = defaultSettingsWithValues.get(settingName) as { value: string, sensitive: boolean, serverEncryptionVersion: number }

      await this.createOrReplace({
        user,
        props: {
          name: settingName,
          value: setting.value,
          serverEncryptionVersion: setting.serverEncryptionVersion,
          sensitive: setting.sensitive,
        },
      })
    }
  }

  async findSetting(dto: FindSettingDTO): Promise<Setting | undefined> {
    let setting: Setting | undefined
    if (dto.settingUuid !== undefined) {
      setting = await this.settingRepository.findOneByUuid(dto.settingUuid)
    } else {
      setting = await this.settingRepository.findLastByNameAndUserUuid(dto.settingName, dto.userUuid)
    }

    if (setting === undefined) {
      return undefined
    }

    if (setting.value !== null && setting.serverEncryptionVersion === EncryptionVersion.Default) {
      const user = await this.userRepository.findOneByUuid(dto.userUuid)

      if (user === undefined) {
        return undefined
      }

      setting.value = await this.crypter.decryptForUser(setting.value, user)
    }

    return setting
  }

  async createOrReplace(dto: CreateOrReplaceSettingDto): Promise<CreateOrReplaceSettingResponse> {
    const { user, props } = dto

    const existing = await this.findSetting({
      userUuid: user.uuid,
      settingName: props.name as SettingName,
      settingUuid: props.uuid,
    })

    if (existing === undefined) {
      const setting = await this.settingRepository.save(await this.factory.create(props, user))

      this.logger.debug('[%s] Created setting %s: %O', user.uuid, props.name, setting)

      await this.triggerDefaultActionsUponSettingCreated(setting, user)

      return {
        status: 'created',
        setting,
      }
    }

    const setting = await this.settingRepository.save(await this.factory.createReplacement(existing, props))

    this.logger.debug('[%s] Replaced existing setting %s with: %O', user.uuid, props.name, setting)

    return {
      status: 'replaced',
      setting,
    }
  }

  private async triggerDefaultActionsUponSettingCreated(setting: Setting, user: User) {
    if (setting.name === SettingName.EmailBackupFrequency) {
      let userHasEmailsMuted = false
      let muteEmailsSettingUuid = ''
      const muteFailedEmailsBackupSetting = await this.settingRepository.findOneByNameAndUserUuid(SettingName.MuteFailedBackupsEmails, user.uuid)
      if (muteFailedEmailsBackupSetting !== undefined) {
        userHasEmailsMuted = muteFailedEmailsBackupSetting.value === MuteFailedBackupsEmailsOption.Muted
        muteEmailsSettingUuid = muteFailedEmailsBackupSetting.uuid
      }

      await this.domainEventPublisher.publish(
        this.domainEventFactory.createEmailBackupRequestedEvent(
          user.uuid,
          muteEmailsSettingUuid,
          userHasEmailsMuted
        )
      )
    }
  }
}
