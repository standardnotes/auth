import { inject, injectable } from 'inversify'
import { UpdateSettingDto } from './UpdateSettingDto'
import { UpdateSettingResponse } from './UpdateSettingResponse'
import { UseCaseInterface } from '../UseCaseInterface'
import TYPES from '../../../Bootstrap/Types'
import { UserRepositoryInterface } from '../../User/UserRepositoryInterface'
import { CreateOrReplaceSettingResponse } from '../../Setting/CreateOrReplaceSettingResponse'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Logger } from 'winston'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { User } from '../../User/User'
import { SettingProps } from '../../Setting/SettingProps'
import { SettingName } from '@standardnotes/settings'
import { RoleServiceInterface } from '../../Role/RoleServiceInterface'
import { SubscriptionName } from '@standardnotes/auth'
import { PaymentsHttpServiceInterface } from '../../Subscription/PaymentsHttpServiceInterface'
import { UserSubscription } from '../../Subscription/UserSubscription'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class UpdateSetting implements UseCaseInterface {
  constructor (
    @inject(TYPES.SettingService) private settingService: SettingServiceInterface,
    @inject(TYPES.SettingProjector) private settingProjector: SettingProjector,
    @inject(TYPES.UserRepository) private userRepository: UserRepositoryInterface,
    @inject(TYPES.UserSubscriptionRepository) private userSubscriptionRepository: UserSubscriptionRepositoryInterface,
    @inject(TYPES.RoleService) private roleService: RoleServiceInterface,
    @inject(TYPES.PaymentsHttpService) private paymentsHttpService: PaymentsHttpServiceInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
  }

  async execute(dto: UpdateSettingDto): Promise<UpdateSettingResponse> {
    this.logger.debug('[%s] Updating setting: %O', dto.userUuid, dto)

    const { userUuid, props } = dto

    const user = await this.userRepository.findOneByUuid(userUuid)

    if (user === undefined) {
      return {
        success: false,
        error: {
          message: `User ${userUuid} not found.`,
        },
      }
    }

    try {
      await this.handleClientSideMigrationOfExtensionKeyToFillSubscriptionData(user, props)
    } catch (error) {
      this.logger.error(`[${user.uuid}] Could not handle client side migration of extension key to fill subscription data: ${error.message}`)
    }

    const response = await this.settingService.createOrReplace({
      user,
      props,
    })

    return {
      success: true,
      setting: await this.settingProjector.projectSimple(response.setting),
      statusCode: this.statusToStatusCode(response),
    }
  }

  /* istanbul ignore next */
  private statusToStatusCode(response: CreateOrReplaceSettingResponse): number {
    if (response.status === 'created') {
      return 201
    }
    if (response.status === 'replaced') {
      return 200
    }

    const exhaustiveCheck: never = response.status
    throw new Error(`Unrecognized status: ${exhaustiveCheck}!`)
  }

  private async handleClientSideMigrationOfExtensionKeyToFillSubscriptionData(
    user: User,
    props: SettingProps
  ): Promise<void> {
    if (props.name !== SettingName.ExtensionKey) {
      return
    }

    this.logger.debug(`[${user.uuid}] Handling client side migration of extension key to fill sync subscription data`)

    const existingSubscription = await this.userSubscriptionRepository.findOneByUserUuid(user.uuid)
    if (existingSubscription !== undefined) {
      this.logger.debug(`[${user.uuid}] User has an existing subscription already`)

      return
    }

    const userWithSubscriptionDataFromPaymentsServer = await this.paymentsHttpService.getUser(props.value as string)
    if (userWithSubscriptionDataFromPaymentsServer === undefined) {
      this.logger.debug(`[${user.uuid}] No user with subscription data retrieved from payments server`)

      return
    }

    await this.roleService.addUserRole(user, SubscriptionName.ProPlan)

    const subscription = new UserSubscription()
    subscription.planName = SubscriptionName.ProPlan
    subscription.user = Promise.resolve(user)
    subscription.createdAt = this.timer.convertStringDateToMicroseconds(userWithSubscriptionDataFromPaymentsServer.subscription.created_at)
    subscription.updatedAt = this.timer.convertStringDateToMicroseconds(userWithSubscriptionDataFromPaymentsServer.subscription.updated_at)
    subscription.endsAt = this.timer.convertStringDateToMicroseconds(userWithSubscriptionDataFromPaymentsServer.subscription.active_until)
    subscription.cancelled = userWithSubscriptionDataFromPaymentsServer.subscription.canceled

    await this.userSubscriptionRepository.save(subscription)
  }
}
