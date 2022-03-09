export type CreateValetTokenDTO = {
  userUuid: string,
  operation: 'read' | 'write' | 'delete',
  resources: Array<string>
}
