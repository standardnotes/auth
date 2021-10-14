import 'reflect-metadata'

import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { DashboardTokenRepositoryInterface } from '../../Auth/DashboardTokenRepositoryInterface'

import { CreateDashboardToken } from './CreateDashboardToken'
import { DomainEventPublisherInterface, DashboardTokenCreatedEvent } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'

describe('CreateDashboardToken', () => {
  let dashboardTokenRepository: DashboardTokenRepositoryInterface
  let cryptoNode: SnCryptoNode
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let timer: TimerInterface

  const createUseCase = () => new CreateDashboardToken(
    dashboardTokenRepository,
    cryptoNode,
    domainEventPublisher,
    domainEventFactory,
    timer,
  )

  beforeEach(() => {
    dashboardTokenRepository = {} as jest.Mocked<DashboardTokenRepositoryInterface>
    dashboardTokenRepository.save = jest.fn()

    cryptoNode = {} as jest.Mocked<SnCryptoNode>
    cryptoNode.generateRandomKey = jest.fn().mockReturnValueOnce('random-string')

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createDashboardTokenCreatedEvent = jest.fn().mockReturnValue({} as jest.Mocked<DashboardTokenCreatedEvent>)

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertStringDateToMicroseconds = jest.fn().mockReturnValue(1)
    timer.getUTCDateNDaysAhead = jest.fn().mockReturnValue(new Date(1))
  })

  it('should create an dashboard token and persist it', async () => {
    await createUseCase().execute({
      userEmail: 'test@test.com',
    })

    expect(dashboardTokenRepository.save).toHaveBeenCalledWith({
      userEmail: 'test@test.com',
      token: 'random-string',
      expiresAt: 1,
    })

    expect(domainEventFactory.createDashboardTokenCreatedEvent).toHaveBeenCalledWith('random-string', 'test@test.com')
    expect(domainEventPublisher.publish).toHaveBeenCalled()
  })
})
