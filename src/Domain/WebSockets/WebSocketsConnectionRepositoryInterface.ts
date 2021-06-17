export interface WebSocketsConnectionRepositoryInterface {
  saveConnection (userUuid: string, connectionId: string): Promise<void>
}
