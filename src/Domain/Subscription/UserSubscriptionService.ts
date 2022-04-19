import { Uuid } from '@standardnotes/common'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'

import { UserSubscription } from './UserSubscription'
import { UserSubscriptionRepositoryInterface } from './UserSubscriptionRepositoryInterface'
import { UserSubscriptionServiceInterface } from './UserSubscriptionServiceInterface'
import { UserSubscriptionType } from './UserSubscriptionType'

@injectable()
export class UserSubscriptionService implements UserSubscriptionServiceInterface {
  constructor(
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
  ){
  }

  async findRegularSubscriptionForUserUuid(userUuid: string): Promise<UserSubscription | undefined> {
    const userSubscription = await this.userSubscriptionRepository.findOneByUserUuid(userUuid)

    return this.findRegularSubscription(userSubscription)
  }

  async findRegularSubscriptionForUuid(uuid: Uuid): Promise<UserSubscription | undefined> {
    const userSubscription = await this.userSubscriptionRepository.findOneByUuid(uuid)

    return this.findRegularSubscription(userSubscription)
  }

  private async findRegularSubscription(userSubscription: UserSubscription | undefined): Promise<UserSubscription | undefined> {
    if (userSubscription === undefined) {
      return undefined
    }

    if (userSubscription.subscriptionType === UserSubscriptionType.Regular) {
      return userSubscription
    }

    const regularSubscriptions = await this.userSubscriptionRepository.findBySubscriptionIdAndType(
      userSubscription.subscriptionId as number,
      UserSubscriptionType.Regular
    )
    if (regularSubscriptions.length === 0) {
      return undefined
    }

    return regularSubscriptions[0]
  }
}
