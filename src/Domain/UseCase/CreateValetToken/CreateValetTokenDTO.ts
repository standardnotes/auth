import { CreateValetTokenPayload } from '@standardnotes/payloads'

export type CreateValetTokenDTO = CreateValetTokenPayload & {
  userUuid: string,
}
