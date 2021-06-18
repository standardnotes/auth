import 'reflect-metadata'

import * as express from 'express'
import { results } from 'inversify-express-utils'

import { AddWebSocketsConnection } from '../Domain/UseCase/AddWebSocketsConnection/AddWebSocketsConnection'

import { WebSocketsController } from './WebSocketsController'
import { Logger } from 'winston'
import { RemoveWebSocketsConnection } from '../Domain/UseCase/RemoveWebSocketsConnection/RemoveWebSocketsConnection'

describe('WebSocketsController', () => {
  let addWebSocketsConnection: AddWebSocketsConnection
  let removeWebSocketsConnection: RemoveWebSocketsConnection
  let request: express.Request
  let logger: Logger

  const createController = () => new WebSocketsController(addWebSocketsConnection, removeWebSocketsConnection, logger)

  beforeEach(() => {
    addWebSocketsConnection = {} as jest.Mocked<AddWebSocketsConnection>
    addWebSocketsConnection.execute = jest.fn()

    removeWebSocketsConnection = {} as jest.Mocked<RemoveWebSocketsConnection>
    removeWebSocketsConnection.execute = jest.fn()

    request = {
      body: {
        userUuid: '1-2-3',
        connectionId: '2-3-4',
      },
      headers: {},
    } as jest.Mocked<express.Request>

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should persist an established web sockets connection', async () => {
    const httpResponse = await createController().storeWebSocketsConnection(request)

    expect(httpResponse).toBeInstanceOf(results.JsonResult)
    expect((<results.JsonResult> httpResponse).statusCode).toEqual(200)

    expect(addWebSocketsConnection.execute).toHaveBeenCalledWith({
      userUuid: '1-2-3',
      connectionId: '2-3-4',
    })
  })

  it('should not persist an established web sockets connection if user uuid is missing', async () => {
    delete request.body.userUuid

    const httpResponse = await createController().storeWebSocketsConnection(request)

    expect(httpResponse).toBeInstanceOf(results.BadRequestErrorMessageResult)

    expect(addWebSocketsConnection.execute).not.toHaveBeenCalled()
  })

  it('should not persist an established web sockets connection if connection id is missing', async () => {
    delete request.body.connectionId

    const httpResponse = await createController().storeWebSocketsConnection(request)

    expect(httpResponse).toBeInstanceOf(results.BadRequestErrorMessageResult)

    expect(addWebSocketsConnection.execute).not.toHaveBeenCalled()
  })

  it('should remove a disconnected web sockets connection', async () => {
    const httpResponse = await createController().deleteWebSocketsConnection(request)

    expect(httpResponse).toBeInstanceOf(results.JsonResult)
    expect((<results.JsonResult> httpResponse).statusCode).toEqual(200)

    expect(removeWebSocketsConnection.execute).toHaveBeenCalledWith({
      connectionId: '2-3-4',
    })
  })

  it('should not remove a disconnected web sockets connection if connection id is missing', async () => {
    delete request.body.connectionId

    const httpResponse = await createController().deleteWebSocketsConnection(request)

    expect(httpResponse).toBeInstanceOf(results.BadRequestErrorMessageResult)

    expect(removeWebSocketsConnection.execute).not.toHaveBeenCalled()
  })
})
