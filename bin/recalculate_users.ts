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
import { UserRepositoryInterface } from '../src/Domain/User/UserRepositoryInterface'

const initializeRecalculationProcedure = async (
  userRepository: UserRepositoryInterface,
  domainEventFactory: DomainEventFactoryInterface,
  domainEventPublisher: DomainEventPublisherInterface,
): Promise<void> => {
  const stream = await userRepository.streamAll()
  return new Promise((resolve, reject) => {
    stream.pipe(new Stream.Transform({
      objectMode: true,
      transform: async (user, _encoding, callback) => {
        await domainEventPublisher.publish(
          domainEventFactory.createItemsContentSizeRecalculationRequestedEvent(user.user_uuid)
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

  logger.info('Starting recalculation procedure for every user...')

  const userRepository: UserRepositoryInterface = container.get(TYPES.UserRepository)
  const domainEventFactory: DomainEventFactoryInterface = container.get(TYPES.DomainEventFactory)
  const domainEventPublisher: DomainEventPublisherInterface = container.get(TYPES.DomainEventPublisher)

  Promise
    .resolve(initializeRecalculationProcedure(
      userRepository,
      domainEventFactory,
      domainEventPublisher,
    ))
    .then(() => {
      logger.info('Recalculation initialization complete')

      process.exit(0)
    })
    .catch((error) => {
      logger.error(`Could not finish recalculation initialization: ${error.message}`)

      process.exit(1)
    })
})
