import 'reflect-metadata'

import { AccountDeletionRequestedEvent, DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { User } from '../../User/User'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { DeleteAccount } from './DeleteAccount'

describe('DeleteAccount', () => {
  let userRepository: UserRepositoryInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface
  let user: User

  const createUseCase = () => new DeleteAccount(
    userRepository,
    domainEventPublisher,
    domainEventFactory,
  )

  beforeEach(() => {
    user = {
      uuid: '1-2-3',
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createAccountDeletionRequestedEvent = jest.fn().mockReturnValue({} as jest.Mocked<AccountDeletionRequestedEvent>)
  })

  it('should trigger account deletion', async () => {
    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'Successfully deleted user',
      responseCode: 200,
      success: true,
    })

    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1)
    expect(domainEventFactory.createAccountDeletionRequestedEvent).toHaveBeenLastCalledWith('1-2-3')
  })

  it('should not trigger account deletion if user is not found', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ email: 'test@test.te' })).toEqual({
      message: 'User not found',
      responseCode: 404,
      success: false,
    })

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createAccountDeletionRequestedEvent).not.toHaveBeenCalled()
  })
})
