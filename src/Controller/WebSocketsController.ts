import { Request } from 'express'
import { inject } from 'inversify'
import {
  BaseHttpController,
  controller,
  httpPost,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  results,
} from 'inversify-express-utils'
import TYPES from '../Bootstrap/Types'
import { AddWebSocketsConnection } from '../Domain/UseCase/AddWebSocketsConnection/AddWebSocketsConnection'

@controller('/sockets')
export class WebSocketsController extends BaseHttpController {
  constructor(
    @inject(TYPES.AddWebSocketsConnection) private addWebSocketsConnection: AddWebSocketsConnection,
  ) {
    super()
  }

  @httpPost('/')
  async storeWebSocketsConnection(request: Request): Promise<results.JsonResult | results.BadRequestErrorMessageResult> {
    if (!request.body.userUuid || !request.body.connectionId) {
      return this.badRequest('Missing user uuid and or connection id')
    }

    await this.addWebSocketsConnection.execute({
      userUuid: request.body.userUuid,
      connectionId: request.body.connectionId,
    })

    return this.json({ success: true })
  }
}
