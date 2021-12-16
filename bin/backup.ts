import 'reflect-metadata'

import 'newrelic'

import { Stream } from 'stream'

import { Logger } from 'winston'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'

import { ContainerConfigLoader } from '../src/Bootstrap/Container'
import TYPES from '../src/Bootstrap/Types'
import { Env } from '../src/Bootstrap/Env'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../src/Domain/Event/DomainEventFactoryInterface'
import { SettingRepositoryInterface } from '../src/Domain/Setting/SettingRepositoryInterface'
import { EmailBackupFrequency, MuteFailedBackupsEmailsOption, SettingName } from '@standardnotes/settings'
import { RoleServiceInterface } from '../src/Domain/Role/RoleServiceInterface'
import { PermissionName } from '@standardnotes/features'

const inputArgs = process.argv.slice(2)
const emailBackupFrequency = inputArgs[0] as EmailBackupFrequency

const requestEmailBackups = async (
  settingRepository: SettingRepositoryInterface,
  roleService: RoleServiceInterface,
  domainEventFactory: DomainEventFactoryInterface,
  domainEventPublisher: DomainEventPublisherInterface,
): Promise<void> => {
  const stream = await settingRepository.streamAllByNameAndValue(SettingName.EmailBackup, emailBackupFrequency)
  return new Promise((resolve, reject) => {
    stream.pipe(new Stream.Transform({
      objectMode: true,
      transform: async (setting, _encoding, callback) => {
        const userIsPermittedForEmailBackups = await roleService.userHasPermission(setting.setting_user_uuid, PermissionName.DailyEmailBackup)
        if (!userIsPermittedForEmailBackups) {
          callback()

          return
        }

        let userHasEmailsMuted = false
        const emailsMutedSetting = await settingRepository.findOneByNameAndUserUuid(SettingName.MuteFailedBackupsEmails, setting.setting_user_uuid)
        if (emailsMutedSetting !== undefined && emailsMutedSetting.value !== null) {
          userHasEmailsMuted = emailsMutedSetting.value === MuteFailedBackupsEmailsOption.Muted
        }

        await domainEventPublisher.publish(
          domainEventFactory.createEmailBackupRequestedEvent(
            setting.setting_user_uuid,
            emailsMutedSetting?.uuid as string,
            userHasEmailsMuted,
          )
        )
        callback()
      },
    }))
      .on('finish', resolve)
      .on('error', reject)
  })
}

const container = new ContainerConfigLoader
void container.load().then(container => {
  dayjs.extend(utc)

  const env: Env = new Env()
  env.load()

  const logger: Logger = container.get(TYPES.Logger)

  logger.info(`Starting ${emailBackupFrequency} email backup requesting...`)

  const settingRepository: SettingRepositoryInterface = container.get(TYPES.SettingRepository)
  const roleService: RoleServiceInterface = container.get(TYPES.RoleService)
  const domainEventFactory: DomainEventFactoryInterface = container.get(TYPES.DomainEventFactory)
  const domainEventPublisher: DomainEventPublisherInterface = container.get(TYPES.DomainEventPublisher)

  Promise
    .resolve(requestEmailBackups(
      settingRepository,
      roleService,
      domainEventFactory,
      domainEventPublisher,
    ))
    .then(() => {
      logger.info(`${emailBackupFrequency} email backup requesting complete`)

      process.exit(0)
    })
    .catch((error) => {
      logger.error(`Could not finish ${emailBackupFrequency} email backup requesting: ${error.message}`)

      process.exit(1)
    })
})
