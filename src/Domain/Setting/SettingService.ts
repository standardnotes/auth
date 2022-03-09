import { SubscriptionName } from '@standardnotes/common'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { DropboxBackupFrequency, EmailBackupFrequency, GoogleDriveBackupFrequency, MuteFailedBackupsEmailsOption, MuteFailedCloudBackupsEmailsOption, OneDriveBackupFrequency, SettingName } from '@standardnotes/settings'
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
import { SettingsAssociationServiceInterface } from './SettingsAssociationServiceInterface'

@injectable()
export class SettingService implements SettingServiceInterface {
  constructor(
    @inject(TYPES.SettingFactory) private factory: SettingFactory,
    @inject(TYPES.SettingRepository) private settingRepository: SettingRepositoryInterface,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
    @inject(TYPES.SettingsAssociationService) private settingsAssociationService: SettingsAssociationServiceInterface,
    @inject(TYPES.DomainEventPublisher) private domainEventPublisher: DomainEventPublisherInterface,
    @inject(TYPES.DomainEventFactory) private domainEventFactory: DomainEventFactoryInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  private readonly cloudBackupTokenSettings = [
    SettingName.DropboxBackupToken,
    SettingName.GoogleDriveBackupToken,
    SettingName.OneDriveBackupToken,
  ]

  private readonly cloudBackupFrequencySettings = [
    SettingName.DropboxBackupFrequency,
    SettingName.GoogleDriveBackupFrequency,
    SettingName.OneDriveBackupFrequency,
  ]

  private readonly cloudBackupFrequencyDisabledValues = [
    DropboxBackupFrequency.Disabled,
    GoogleDriveBackupFrequency.Disabled,
    OneDriveBackupFrequency.Disabled,
  ]

  async applyDefaultSettingsForSubscription(user: User, subscriptionName: SubscriptionName): Promise<void> {
    const defaultSettingsWithValues = await this.settingsAssociationService.getDefaultSettingsAndValuesForSubscriptionName(subscriptionName)
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
          unencryptedValue: setting.value,
          serverEncryptionVersion: setting.serverEncryptionVersion,
          sensitive: setting.sensitive,
        },
      })
    }
  }

  async applyDefaultSettingsUponRegistration(user: User): Promise<void> {
    const defaultSettingsWithValues = this.settingsAssociationService.getDefaultSettingsAndValuesForNewUser()

    for (const settingName of defaultSettingsWithValues.keys()) {
      const setting = defaultSettingsWithValues.get(settingName) as { value: string, sensitive: boolean, serverEncryptionVersion: number }

      await this.createOrReplace({
        user,
        props: {
          name: settingName,
          unencryptedValue: setting.value,
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

      await this.triggerDefaultActionsUponSettingUpdated(setting, user, props.unencryptedValue)

      return {
        status: 'created',
        setting,
      }
    }

    const setting = await this.settingRepository.save(await this.factory.createReplacement(existing, props))

    this.logger.debug('[%s] Replaced existing setting %s with: %O', user.uuid, props.name, setting)

    await this.triggerDefaultActionsUponSettingUpdated(setting, user, props.unencryptedValue)

    return {
      status: 'replaced',
      setting,
    }
  }

  private async triggerDefaultActionsUponSettingUpdated(setting: Setting, user: User, unencryptedValue: string | null) {
    if (this.isEnablingEmailBackupSetting(setting)) {
      await this.triggerEmailBackup(user.uuid)
    }

    if (this.isEnablingCloudBackupSetting(setting)) {
      await this.triggerCloudBackup(setting, user.uuid, unencryptedValue)
    }
  }

  private async triggerEmailBackup(userUuid: string): Promise<void> {
    let userHasEmailsMuted = false
    let muteEmailsSettingUuid = ''
    const muteFailedEmailsBackupSetting = await this.settingRepository.findOneByNameAndUserUuid(SettingName.MuteFailedBackupsEmails, userUuid)
    if (muteFailedEmailsBackupSetting !== undefined) {
      userHasEmailsMuted = muteFailedEmailsBackupSetting.value === MuteFailedBackupsEmailsOption.Muted
      muteEmailsSettingUuid = muteFailedEmailsBackupSetting.uuid
    }

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createEmailBackupRequestedEvent(
        userUuid,
        muteEmailsSettingUuid,
        userHasEmailsMuted
      )
    )
  }

  private isEnablingEmailBackupSetting(setting: Setting): boolean {
    return setting.name === SettingName.EmailBackupFrequency && setting.value !== EmailBackupFrequency.Disabled
  }

  private isEnablingCloudBackupSetting(setting: Setting): boolean {
    return (this.cloudBackupFrequencySettings.includes(setting.name as SettingName)
      || this.cloudBackupTokenSettings.includes(setting.name as SettingName))
      && !this.cloudBackupFrequencyDisabledValues.includes(setting.value as DropboxBackupFrequency | OneDriveBackupFrequency | GoogleDriveBackupFrequency)
  }

  private async triggerCloudBackup(setting: Setting, userUuid: string, unencryptedValue: string | null): Promise<void> {
    let cloudProvider
    let tokenSettingName
    switch (setting.name) {
    case SettingName.DropboxBackupToken:
    case SettingName.DropboxBackupFrequency:
      cloudProvider = 'DROPBOX'
      tokenSettingName = SettingName.DropboxBackupToken
      break
    case SettingName.GoogleDriveBackupToken:
    case SettingName.GoogleDriveBackupFrequency:
      cloudProvider = 'GOOGLE_DRIVE'
      tokenSettingName = SettingName.GoogleDriveBackupToken
      break
    case SettingName.OneDriveBackupToken:
    case SettingName.OneDriveBackupFrequency:
      cloudProvider = 'ONE_DRIVE'
      tokenSettingName = SettingName.OneDriveBackupToken
      break
    }

    let backupToken = null
    if (this.cloudBackupFrequencySettings.includes(setting.name as SettingName)) {
      const tokenSetting = await this.findSetting({ settingName: tokenSettingName as SettingName, userUuid })
      if (tokenSetting !== undefined) {
        backupToken = tokenSetting.value as string
      }
    } else {
      backupToken = unencryptedValue
    }

    if (!backupToken) {
      this.logger.error(`Could not trigger backup. Missing backup token for user ${userUuid}`)

      return
    }

    let userHasEmailsMuted = false
    let muteEmailsSettingUuid = ''
    const muteFailedCloudBackupSetting = await this.settingRepository.findOneByNameAndUserUuid(SettingName.MuteFailedCloudBackupsEmails, userUuid)
    if (muteFailedCloudBackupSetting !== undefined) {
      userHasEmailsMuted = muteFailedCloudBackupSetting.value === MuteFailedCloudBackupsEmailsOption.Muted
      muteEmailsSettingUuid = muteFailedCloudBackupSetting.uuid
    }

    await this.domainEventPublisher.publish(
      this.domainEventFactory.createCloudBackupRequestedEvent(
        cloudProvider as 'DROPBOX' | 'GOOGLE_DRIVE' | 'ONE_DRIVE',
        backupToken,
        userUuid,
        muteEmailsSettingUuid,
        userHasEmailsMuted
      )
    )
  }
}
