export interface WebSocketsConnectionRepositoryInterface {
  saveConnection (userUuid: string, connectionId: string): Promise<void>
  removeConnection (connectionId: string): Promise<void>
}
