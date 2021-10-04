import 'reflect-metadata'

import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { TimerInterface } from '@standardnotes/time'
import { PurchaseTokenRepositoryInterface } from '../../Subscription/PurchaseTokenRepositoryInterface'

import { CreatePurchaseToken } from './CreatePurchaseToken'

describe('CreatePurchaseToken', () => {
  let purchaseTokenRepository: PurchaseTokenRepositoryInterface
  let cryptoNode: SnCryptoNode
  let timer: TimerInterface

  const createUseCase = () => new CreatePurchaseToken(
    purchaseTokenRepository,
    cryptoNode,
    timer,
  )

  beforeEach(() => {
    purchaseTokenRepository = {} as jest.Mocked<PurchaseTokenRepositoryInterface>
    purchaseTokenRepository.save = jest.fn()

    cryptoNode = {} as jest.Mocked<SnCryptoNode>
    cryptoNode.generateRandomKey = jest.fn().mockReturnValueOnce('random-string')

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertStringDateToMicroseconds = jest.fn().mockReturnValue(1)
    timer.getUTCDateNDaysAhead = jest.fn().mockReturnValue(new Date(1))
  })

  it('should create an purchase token and persist it', async () => {
    await createUseCase().execute({
      userUuid: '1-2-3',
    })

    expect(purchaseTokenRepository.save).toHaveBeenCalledWith({
      userUuid: '1-2-3',
      token: 'random-string',
      expiresAt: 1,
    })
  })
})
