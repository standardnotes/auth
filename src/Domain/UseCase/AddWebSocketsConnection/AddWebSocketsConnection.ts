import { inject, injectable } from 'inversify'
import TYPES from '../../../Bootstrap/Types'
import { WebSocketsConnectionRepositoryInterface } from '../../WebSockets/WebSocketsConnectionRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'
import { AddWebSocketsConnectionDTO } from './AddWebSocketsConnectionDTO'
import { AddWebSocketsConnectionResponse } from './AddWebSocketsConnectionResponse'

@injectable()
export class AddWebSocketsConnection implements UseCaseInterface {
  constructor(
    @inject(TYPES.WebSocketsConnectionRepository) private webSocketsConnectionRepository: WebSocketsConnectionRepositoryInterface
  ) {
  }

  async execute(dto: AddWebSocketsConnectionDTO): Promise<AddWebSocketsConnectionResponse> {
    await this.webSocketsConnectionRepository.saveConnection(
      dto.userUuid,
      dto.connectionId
    )

    return {
      success: true,
    }
  }
}
