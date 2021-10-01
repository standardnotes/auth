import 'reflect-metadata'

import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { EphemeralTokenRepositoryInterface } from '../../Subscription/EphemeralTokenRepositoryInterface'

import { CreateEphemeralToken } from './CreateEphemeralToken'

describe('CreateEphemeralToken', () => {
  let ephemeralTokenRepository: EphemeralTokenRepositoryInterface
  let cryptoNode: SnCryptoNode
  let timer: TimerInterface

  const createUseCase = () => new CreateEphemeralToken(
    ephemeralTokenRepository,
    cryptoNode,
    timer,
  )

  beforeEach(() => {
    ephemeralTokenRepository = {} as jest.Mocked<EphemeralTokenRepositoryInterface>
    ephemeralTokenRepository.save = jest.fn()

    cryptoNode = {} as jest.Mocked<SnCryptoNode>
    cryptoNode.generateRandomKey = jest.fn().mockReturnValueOnce('random-string')

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertStringDateToMicroseconds = jest.fn().mockReturnValue(1)
    timer.getUTCDateNDaysAhead = jest.fn().mockReturnValue(new Date(1))
  })

  it('should create an ephemeral token and persist it', async () => {
    await createUseCase().execute({
      userUuid: '1-2-3',
      email: 'test@test.te',
    })

    expect(ephemeralTokenRepository.save).toHaveBeenCalledWith({
      userUuid: '1-2-3',
      email: 'test@test.te',
      token: 'random-string',
      expiresAt: 1,
    })
  })
})
