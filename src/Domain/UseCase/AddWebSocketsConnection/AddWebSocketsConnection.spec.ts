import 'reflect-metadata'
import { WebSocketsConnectionRepositoryInterface } from '../../WebSockets/WebSocketsConnectionRepositoryInterface'

import { AddWebSocketsConnection } from './AddWebSocketsConnection'

describe('AddWebSocketsConnection', () => {
  let webSocketsConnectionRepository: WebSocketsConnectionRepositoryInterface

  const createUseCase = () => new AddWebSocketsConnection(webSocketsConnectionRepository)

  beforeEach(() => {
    webSocketsConnectionRepository = {} as jest.Mocked<WebSocketsConnectionRepositoryInterface>
    webSocketsConnectionRepository.saveConnection = jest.fn()
  })

  it('should save a web sockets connection for a user for further communication', async () => {
    await createUseCase().execute({ userUuid: '1-2-3', connectionId: '2-3-4' })

    expect(webSocketsConnectionRepository.saveConnection).toHaveBeenCalledWith('1-2-3', '2-3-4')
  })
})
