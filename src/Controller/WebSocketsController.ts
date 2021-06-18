import { Request } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpDelete,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import { Logger } from 'winston'
import TYPES from '../Bootstrap/Types'
import { AddWebSocketsConnection } from '../Domain/UseCase/AddWebSocketsConnection/AddWebSocketsConnection'
import { RemoveWebSocketsConnection } from '../Domain/UseCase/RemoveWebSocketsConnection/RemoveWebSocketsConnection'

@controller('/sockets')
export class WebSocketsController extends BaseHttpController {
  constructor(
    @inject(TYPES.AddWebSocketsConnection) private addWebSocketsConnection: AddWebSocketsConnection,
    @inject(TYPES.RemoveWebSocketsConnection) private removeWebSocketsConnection: RemoveWebSocketsConnection,
    @inject(TYPES.Logger) private logger: Logger
  ) {
    super()
  }

  @httpPost('/')
  async storeWebSocketsConnection(request: Request): Promise<results.JsonResult | results.BadRequestErrorMessageResult> {
    if (!request.body.userUuid || !request.body.connectionId) {
      this.logger.debug('Missing required parameters from the request: %O', request.body)

      return this.badRequest('Missing user uuid and or connection id')
    }

    await this.addWebSocketsConnection.execute({
      userUuid: request.body.userUuid,
      connectionId: request.body.connectionId,
    })

    return this.json({ success: true })
  }

  @httpDelete('/')
  async deleteWebSocketsConnection(request: Request): Promise<results.JsonResult | results.BadRequestErrorMessageResult> {
    if (!request.body.connectionId) {
      this.logger.debug('Missing required parameters from the request: %O', request.body)

      return this.badRequest('Missing connection id')
    }

    await this.removeWebSocketsConnection.execute({ connectionId: request.body.connectionId })

    return this.json({ success: true })
  }
}
