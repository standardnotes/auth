import 'reflect-metadata'

import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { OfflineSubscriptionTokenRepositoryInterface } from '../../Auth/OfflineSubscriptionTokenRepositoryInterface'

import { CreateOfflineSubscriptionToken } from './CreateOfflineSubscriptionToken'
import { DomainEventPublisherInterface, OfflineSubscriptionTokenCreatedEvent } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'

describe('CreateOfflineSubscriptionToken', () => {
  let offlineSubscriptionTokenRepository: OfflineSubscriptionTokenRepositoryInterface
  let cryptoNode: SnCryptoNode
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let timer: TimerInterface

  const createUseCase = () => new CreateOfflineSubscriptionToken(
    offlineSubscriptionTokenRepository,
    cryptoNode,
    domainEventPublisher,
    domainEventFactory,
    timer,
  )

  beforeEach(() => {
    offlineSubscriptionTokenRepository = {} as jest.Mocked<OfflineSubscriptionTokenRepositoryInterface>
    offlineSubscriptionTokenRepository.save = jest.fn()

    cryptoNode = {} as jest.Mocked<SnCryptoNode>
    cryptoNode.generateRandomKey = jest.fn().mockReturnValueOnce('random-string')

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createOfflineSubscriptionTokenCreatedEvent = jest.fn().mockReturnValue({} as jest.Mocked<OfflineSubscriptionTokenCreatedEvent>)

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertStringDateToMicroseconds = jest.fn().mockReturnValue(1)
    timer.getUTCDateNDaysAhead = jest.fn().mockReturnValue(new Date(1))
  })

  it('should create an dashboard token and persist it', async () => {
    await createUseCase().execute({
      userEmail: 'test@test.com',
    })

    expect(offlineSubscriptionTokenRepository.save).toHaveBeenCalledWith({
      userEmail: 'test@test.com',
      token: 'random-string',
      expiresAt: 1,
    })

    expect(domainEventFactory.createOfflineSubscriptionTokenCreatedEvent).toHaveBeenCalledWith('random-string', 'test@test.com')
    expect(domainEventPublisher.publish).toHaveBeenCalled()
  })
})
