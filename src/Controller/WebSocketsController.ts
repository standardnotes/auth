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

  @httpPost('/:connectionId')
  async storeWebSocketsConnection(request: Request): Promise<results.JsonResult | results.BadRequestErrorMessageResult> {
    if (!request.body.userUuid) {
      this.logger.debug('Missing required user uuid from the request: %O', request.body)

      return this.badRequest('Missing user uuid')
    }

    await this.addWebSocketsConnection.execute({
      userUuid: request.body.userUuid,
      connectionId: request.params.connectionId,
    })

    return this.json({ success: true })
  }

  @httpDelete('/:connectionId')
  async deleteWebSocketsConnection(request: Request): Promise<results.JsonResult | results.BadRequestErrorMessageResult> {
    await this.removeWebSocketsConnection.execute({ connectionId: request.params.connectionId })

    return this.json({ success: true })
  }
}
