import { Uuid } from '@standardnotes/common'
import { inject, injectable } from 'inversify'

import TYPES from '../../Bootstrap/Types'
import { FindRegularSubscriptionResponse } from './FindRegularSubscriptionResponse'

import { UserSubscription } from './UserSubscription'
import { UserSubscriptionRepositoryInterface } from './UserSubscriptionRepositoryInterface'
import { UserSubscriptionServiceInterface } from './UserSubscriptionServiceInterface'
import { UserSubscriptionType } from './UserSubscriptionType'

@injectable()
export class UserSubscriptionService implements UserSubscriptionServiceInterface {
  constructor(
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
  ) {}

  async findRegularSubscriptionForUserUuid(userUuid: string): Promise<FindRegularSubscriptionResponse> {
    const userSubscription = await this.userSubscriptionRepository.findOneByUserUuid(userUuid)

    return this.findRegularSubscription(userSubscription)
  }

  async findRegularSubscriptionForUuid(uuid: Uuid): Promise<FindRegularSubscriptionResponse> {
    const userSubscription = await this.userSubscriptionRepository.findOneByUuid(uuid)

    return this.findRegularSubscription(userSubscription)
  }

  private async findRegularSubscription(
    userSubscription: UserSubscription | undefined,
  ): Promise<FindRegularSubscriptionResponse> {
    if (userSubscription === undefined) {
      return {
        regularSubscription: undefined,
        sharedSubscription: undefined,
      }
    }

    if (userSubscription.subscriptionType === UserSubscriptionType.Regular) {
      return {
        regularSubscription: userSubscription,
        sharedSubscription: undefined,
      }
    }

    const regularSubscriptions = await this.userSubscriptionRepository.findBySubscriptionIdAndType(
      userSubscription.subscriptionId as number,
      UserSubscriptionType.Regular,
    )
    if (regularSubscriptions.length === 0) {
      return {
        regularSubscription: undefined,
        sharedSubscription: userSubscription,
      }
    }

    return {
      regularSubscription: regularSubscriptions[0],
      sharedSubscription: userSubscription,
    }
  }
}
