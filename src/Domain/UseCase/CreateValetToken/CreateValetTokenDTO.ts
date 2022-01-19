export type CreateValetTokenDTO = {
  userUuid: string,
  operation: 'read' | 'write',
  resources?: Array<string>
}
