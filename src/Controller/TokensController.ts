import { RoleName, Token } from '@standardnotes/auth'
import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import { sign } from 'jsonwebtoken'

import TYPES from '../Bootstrap/Types'
import { Role } from '../Domain/Role/Role'
import { AuthenticateToken } from '../Domain/UseCase/AuthenticateToken/AuthenticateToken'
import { CreateEphemeralToken } from '../Domain/UseCase/CreateEphemeralToken/CreateEphemeralToken'
import { User } from '../Domain/User/User'
import { ProjectorInterface } from '../Projection/ProjectorInterface'

@controller('/tokens')
export class TokensController extends BaseHttpController {
  constructor(
    @inject(TYPES.CreateEphemeralToken) private createEphemeralToken: CreateEphemeralToken,
    @inject(TYPES.AuthenticateToken) private authenticateToken: AuthenticateToken,
    @inject(TYPES.UserProjector) private userProjector: ProjectorInterface<User>,
    @inject(TYPES.RoleProjector) private roleProjector: ProjectorInterface<Role>,
    @inject(TYPES.AUTH_JWT_SECRET) private jwtSecret: string,
    @inject(TYPES.AUTH_JWT_TTL) private jwtTTL: number,
  ) {
    super()
  }

  @httpPost('/', TYPES.ApiGatewayAuthMiddleware)
  async createToken(_request: Request, response: Response): Promise<results.JsonResult> {
    const result = await this.createEphemeralToken.execute({
      userUuid: response.locals.user.uuid,
    })

    return this.json(result.ephemeralToken)
  }

  @httpPost('/:token/validate')
  async validate(request: Request): Promise<results.JsonResult> {
    const authenticateTokenResponse = await this.authenticateToken.execute({
      token: request.params.token,
    })

    if (!authenticateTokenResponse.success) {
      return this.json({
        error: {
          tag: 'invalid-auth',
          message: 'Invalid login credentials.',
        },
      }, 401)
    }

    const roles = await (authenticateTokenResponse.user as User).roles

    const authTokenData: Token = {
      user: await this.projectUser(authenticateTokenResponse.user as User),
      roles: await this.projectRoles(roles),
    }

    const authToken = sign(authTokenData, this.jwtSecret, { algorithm: 'HS256', expiresIn: this.jwtTTL })

    return this.json({ authToken })
  }

  private async projectUser(user: User): Promise<{ uuid: string, email: string}> {
    return <{ uuid: string, email: string}> await this.userProjector.projectSimple(user)
  }

  private async projectRoles(roles: Array<Role>): Promise<Array<{ uuid: string, name: RoleName }>> {
    const roleProjections = []
    for (const role of roles) {
      roleProjections.push(<{ uuid: string, name: RoleName }> await this.roleProjector.projectSimple(role))
    }

    return roleProjections
  }
}
