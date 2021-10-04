import { Uuid } from '@standardnotes/common'

import { PurchaseToken } from './PurchaseToken'

export interface PurchaseTokenRepositoryInterface {
  save(purchaseToken: PurchaseToken): Promise<void>
  getUserUuidByToken(token: string): Promise<Uuid | undefined>
}
