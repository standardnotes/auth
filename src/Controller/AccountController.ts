import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpPut,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'

import TYPES from '../Bootstrap/Types'
import { ClearLoginAttempts } from '../Domain/UseCase/ClearLoginAttempts'
import { IncreaseLoginAttempts } from '../Domain/UseCase/IncreaseLoginAttempts'
import { ChangeCredentials } from '../Domain/UseCase/ChangeCredentials/ChangeCredentials'

@controller('/account')
export class AccountController extends BaseHttpController {
  constructor(
    @inject(TYPES.ClearLoginAttempts) private clearLoginAttempts: ClearLoginAttempts,
    @inject(TYPES.IncreaseLoginAttempts) private increaseLoginAttempts: IncreaseLoginAttempts,
    @inject(TYPES.ChangeCredentials) private changeCredentialsUseCase: ChangeCredentials,
  ) {
    super()
  }

  @httpPut('/credentials', TYPES.AuthMiddleware)
  async changeCredentials(request: Request, response: Response): Promise<results.JsonResult> {
    if (!request.body.current_password) {
      return this.json({
        error: {
          message: 'Your current password is required to change your password. Please update your application if you do not see this option.',
        },
      }, 400)
    }

    if (!request.body.new_password) {
      return this.json({
        error: {
          message: 'Your new password is required to change your password. Please try again.',
        },
      }, 400)
    }

    if (!request.body.pw_nonce) {
      return this.json({
        error: {
          message: 'The change password request is missing new auth parameters. Please try again.',
        },
      }, 400)
    }

    const changeCredentialsResult = await this.changeCredentialsUseCase.execute({
      user: response.locals.user,
      apiVersion: request.body.api,
      currentPassword: request.body.current_password,
      newPassword: request.body.new_password,
      newEmail: request.body.new_email,
      pwNonce: request.body.pw_nonce,
      kpCreated: request.body.created,
      kpOrigination: request.body.origination,
      updatedWithUserAgent: <string> request.headers['user-agent'],
      protocolVersion: request.body.version,
    })

    if (!changeCredentialsResult.success) {
      await this.increaseLoginAttempts.execute({ email: response.locals.user.email })

      return this.json({
        error: {
          message: changeCredentialsResult.errorMessage,
        },
      }, 401)
    }

    await this.clearLoginAttempts.execute({ email: response.locals.user.email })

    return this.json(changeCredentialsResult.authResponse)
  }
}
