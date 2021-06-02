import { Request, Response } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import { sign } from 'jsonwebtoken'
import TYPES from '../Bootstrap/Types'
import { Session } from '../Domain/Session/Session'
import { AuthenticateRequest } from '../Domain/UseCase/AuthenticateRequest'
import { GetActiveSessionsForUser } from '../Domain/UseCase/GetActiveSessionsForUser'
import { Permission } from '../Domain/Permission/Permission'
import { Role } from '../Domain/Role/Role'
import { User } from '../Domain/User/User'
import { ProjectorInterface } from '../Projection/ProjectorInterface'
import { SessionProjector } from '../Projection/SessionProjector'

@controller('/sessions')
export class SessionsController extends BaseHttpController {
  constructor(
    @inject(TYPES.GetActiveSessionsForUser) private getActiveSessionsForUser: GetActiveSessionsForUser,
    @inject(TYPES.AuthenticateRequest) private authenticateRequest: AuthenticateRequest,
    @inject(TYPES.UserProjector) private userProjector: ProjectorInterface<User>,
    @inject(TYPES.SessionProjector) private sessionProjector: ProjectorInterface<Session>,
    @inject(TYPES.RoleProjector) private roleProjector: ProjectorInterface<Role>,
    @inject(TYPES.PermissionProjector) private permissionProjector: ProjectorInterface<Permission>,
    @inject(TYPES.AUTH_JWT_SECRET) private jwtSecret: string,
    @inject(TYPES.AUTH_JWT_TTL) private jwtTTL: number,
  ) {
    super()
  }

  @httpPost('/validate')
  async validate(request: Request): Promise<results.JsonResult> {
    const authenticateRequestResponse = await this.authenticateRequest.execute({
      authorizationHeader: request.headers.authorization,
    })

    if (!authenticateRequestResponse.success) {
      return this.json({
        error: {
          tag: authenticateRequestResponse.errorTag,
          message: authenticateRequestResponse.errorMessage,
        },
      }, authenticateRequestResponse.responseCode)
    }

    const roles = await (<User> authenticateRequestResponse.user).roles
    const permissions: Map<string, Permission> = new Map()
    await Promise.all(roles.map(async (role: Role) => {
      const rolePermissions = await role.permissions
      rolePermissions.forEach(permission => permissions.set(permission.uuid, permission))
    }))

    const authTokenData = {
      user: this.userProjector.projectSimple(<User> authenticateRequestResponse.user),
      session: this.sessionProjector.projectSimple(<Session> authenticateRequestResponse.session),
      roles: roles.map(role => this.roleProjector.projectSimple(role)),
      permissions: [...permissions.values()].map(permission => this.permissionProjector.projectSimple(permission)),
    }

    const authToken = sign(authTokenData, this.jwtSecret, { algorithm: 'HS256', expiresIn: this.jwtTTL })

    return this.json({ authToken })
  }

  @httpGet('/', TYPES.AuthMiddleware, TYPES.SessionMiddleware)
  async getSessions(_request: Request, response: Response): Promise<results.JsonResult> {
    const useCaseResponse = await this.getActiveSessionsForUser.execute({
      userUuid: response.locals.user.uuid,
    })

    return this.json(
      useCaseResponse.sessions.map(
        (session) => this.sessionProjector.projectCustom(
          SessionProjector.CURRENT_SESSION_PROJECTION.toString(),
          session,
          response.locals.session
        )
      )
    )
  }
}
