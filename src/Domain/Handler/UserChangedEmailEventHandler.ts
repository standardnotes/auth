import { DomainEventHandlerInterface, UserChangedEmailEvent } from '@standardnotes/domain-events'
import { AxiosInstance } from 'axios'
import { inject, injectable } from 'inversify'
import { Logger } from 'winston'

import TYPES from '../../Bootstrap/Types'

@injectable()
export class UserChangedEmailEventHandler implements DomainEventHandlerInterface {
  constructor (
    @inject(TYPES.HTTPClient) private httpClient: AxiosInstance,
    @inject(TYPES.USER_SERVER_CHANGE_EMAIL_URL) private userServerChangeEmailUrl: string,
    @inject(TYPES.USER_SERVER_AUTH_KEY) private userServerAuthKey: string,
    @inject(TYPES.Logger) private logger: Logger
  ) {
  }

  async handle(event: UserChangedEmailEvent): Promise<void> {
    if (!this.userServerChangeEmailUrl) {
      this.logger.debug('User server change email url not defined. Skipped post email change actions.')

      return
    }

    await this.httpClient
      .request({
        method: 'POST',
        url: this.userServerChangeEmailUrl,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: {
          key: this.userServerAuthKey,
          user: {
            uuid: event.payload.userUuid,
            from_email: event.payload.fromEmail,
            to_email: event.payload.toEmail,
          },
        },
        validateStatus:
          /* istanbul ignore next */
          (status: number) => status >= 200 && status < 500,
      })
  }
}
