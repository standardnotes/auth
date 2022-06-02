import 'reflect-metadata'

import 'newrelic'

import { Stream } from 'stream'

import { Logger } from 'winston'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { AnalyticsActivity, AnalyticsStoreInterface, Period } from '@standardnotes/analytics'

import { ContainerConfigLoader } from '../src/Bootstrap/Container'
import TYPES from '../src/Bootstrap/Types'
import { Env } from '../src/Bootstrap/Env'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../src/Domain/Event/DomainEventFactoryInterface'
import { SettingRepositoryInterface } from '../src/Domain/Setting/SettingRepositoryInterface'
import { MuteFailedBackupsEmailsOption, MuteFailedCloudBackupsEmailsOption, SettingName } from '@standardnotes/settings'
import { RoleServiceInterface } from '../src/Domain/Role/RoleServiceInterface'
import { PermissionName } from '@standardnotes/features'
import { SettingServiceInterface } from '../src/Domain/Setting/SettingServiceInterface'
import { AnalyticsEntityRepositoryInterface } from '../src/Domain/Analytics/AnalyticsEntityRepositoryInterface'

const inputArgs = process.argv.slice(2)
const backupProvider = inputArgs[0]
const backupFrequency = inputArgs[1]

const shouldEmailBackupBeTriggered = async (
  analyticsId: number,
  analyticsStore: AnalyticsStoreInterface,
): Promise<boolean> => {
  let periods = [Period.Today, Period.Yesterday]
  if (backupFrequency === 'weekly') {
    periods = [Period.ThisWeek, Period.LastWeek]
  }

  for (const period of periods) {
    const wasUnBackedUpDataCreatedInPeriod = await analyticsStore.wasActivityDone(
      AnalyticsActivity.EmailUnbackedUpData,
      analyticsId,
      period,
    )
    if (wasUnBackedUpDataCreatedInPeriod) {
      return true
    }
  }

  return false
}

const requestBackups = async (
  settingRepository: SettingRepositoryInterface,
  roleService: RoleServiceInterface,
  settingService: SettingServiceInterface,
  domainEventFactory: DomainEventFactoryInterface,
  domainEventPublisher: DomainEventPublisherInterface,
  analyticsEntityRepository: AnalyticsEntityRepositoryInterface,
  analyticsStore: AnalyticsStoreInterface,
): Promise<void> => {
  let settingName: SettingName,
    permissionName: PermissionName,
    muteEmailsSettingName: SettingName,
    muteEmailsSettingValue: string,
    providerTokenSettingName: SettingName
  switch (backupProvider) {
    case 'email':
      settingName = SettingName.EmailBackupFrequency
      permissionName = PermissionName.DailyEmailBackup
      muteEmailsSettingName = SettingName.MuteFailedBackupsEmails
      muteEmailsSettingValue = MuteFailedBackupsEmailsOption.Muted
      break
    case 'dropbox':
      settingName = SettingName.DropboxBackupFrequency
      permissionName = PermissionName.DailyDropboxBackup
      muteEmailsSettingName = SettingName.MuteFailedCloudBackupsEmails
      muteEmailsSettingValue = MuteFailedCloudBackupsEmailsOption.Muted
      providerTokenSettingName = SettingName.DropboxBackupToken
      break
    case 'one_drive':
      settingName = SettingName.OneDriveBackupFrequency
      permissionName = PermissionName.DailyOneDriveBackup
      muteEmailsSettingName = SettingName.MuteFailedCloudBackupsEmails
      muteEmailsSettingValue = MuteFailedCloudBackupsEmailsOption.Muted
      providerTokenSettingName = SettingName.OneDriveBackupToken
      break
    case 'google_drive':
      settingName = SettingName.GoogleDriveBackupFrequency
      permissionName = PermissionName.DailyGDriveBackup
      muteEmailsSettingName = SettingName.MuteFailedCloudBackupsEmails
      muteEmailsSettingValue = MuteFailedCloudBackupsEmailsOption.Muted
      providerTokenSettingName = SettingName.GoogleDriveBackupToken
      break
    default:
      throw new Error(`Not handled backup provider: ${backupProvider}`)
  }

  const stream = await settingRepository.streamAllByNameAndValue(settingName, backupFrequency)

  return new Promise((resolve, reject) => {
    stream
      .pipe(
        new Stream.Transform({
          objectMode: true,
          transform: async (setting, _encoding, callback) => {
            const userIsPermittedForEmailBackups = await roleService.userHasPermission(
              setting.setting_user_uuid,
              permissionName,
            )
            if (!userIsPermittedForEmailBackups) {
              callback()

              return
            }

            let userHasEmailsMuted = false
            const emailsMutedSetting = await settingRepository.findOneByNameAndUserUuid(
              muteEmailsSettingName,
              setting.setting_user_uuid,
            )
            if (emailsMutedSetting !== null && emailsMutedSetting.value !== null) {
              userHasEmailsMuted = emailsMutedSetting.value === muteEmailsSettingValue
            }

            if (backupProvider === 'email') {
              const analyticsEntity = await analyticsEntityRepository.findOneByUserUuid(setting.setting_user_uuid)
              if (analyticsEntity === null) {
                callback()

                return
              }

              const emailBackupsShouldBeTriggered = await shouldEmailBackupBeTriggered(
                analyticsEntity.id,
                analyticsStore,
              )
              if (!emailBackupsShouldBeTriggered) {
                callback()

                return
              }

              await domainEventPublisher.publish(
                domainEventFactory.createEmailBackupRequestedEvent(
                  setting.setting_user_uuid,
                  emailsMutedSetting?.uuid as string,
                  userHasEmailsMuted,
                ),
              )

              await analyticsStore.markActivity([AnalyticsActivity.EmailBackup], analyticsEntity.id, [
                Period.Today,
                Period.ThisWeek,
              ])
              await analyticsStore.unmarkActivity([AnalyticsActivity.EmailUnbackedUpData], analyticsEntity.id, [
                Period.Today,
                Period.ThisWeek,
              ])

              callback()

              return
            }

            const cloudBackupProviderToken = await settingService.findSettingWithDecryptedValue({
              settingName: providerTokenSettingName,
              userUuid: setting.setting_user_uuid,
            })
            if (cloudBackupProviderToken === null || cloudBackupProviderToken.value === null) {
              callback()

              return
            }

            await domainEventPublisher.publish(
              domainEventFactory.createCloudBackupRequestedEvent(
                backupProvider.toUpperCase() as 'DROPBOX' | 'ONE_DRIVE' | 'GOOGLE_DRIVE',
                cloudBackupProviderToken.value,
                setting.setting_user_uuid,
                emailsMutedSetting?.uuid as string,
                userHasEmailsMuted,
              ),
            )
            callback()
          },
        }),
      )
      .on('finish', resolve)
      .on('error', reject)
  })
}

const container = new ContainerConfigLoader()
void container.load().then((container) => {
  dayjs.extend(utc)

  const env: Env = new Env()
  env.load()

  const logger: Logger = container.get(TYPES.Logger)

  logger.info(`Starting ${backupFrequency} ${backupProvider} backup requesting...`)

  const settingRepository: SettingRepositoryInterface = container.get(TYPES.SettingRepository)
  const roleService: RoleServiceInterface = container.get(TYPES.RoleService)
  const settingService: SettingServiceInterface = container.get(TYPES.SettingService)
  const domainEventFactory: DomainEventFactoryInterface = container.get(TYPES.DomainEventFactory)
  const domainEventPublisher: DomainEventPublisherInterface = container.get(TYPES.DomainEventPublisher)
  const analyticsEntityRepository: AnalyticsEntityRepositoryInterface = container.get(TYPES.AnalyticsEntityRepository)
  const analyticsStore: AnalyticsStoreInterface = container.get(TYPES.AnalyticsStore)

  Promise.resolve(
    requestBackups(
      settingRepository,
      roleService,
      settingService,
      domainEventFactory,
      domainEventPublisher,
      analyticsEntityRepository,
      analyticsStore,
    ),
  )
    .then(() => {
      logger.info(`${backupFrequency} ${backupProvider} backup requesting complete`)

      process.exit(0)
    })
    .catch((error) => {
      logger.error(`Could not finish ${backupFrequency} ${backupProvider} backup requesting: ${error.message}`)

      process.exit(1)
    })
})
