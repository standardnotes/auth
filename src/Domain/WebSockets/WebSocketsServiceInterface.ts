import { RoleName } from '@standardnotes/auth'
import { User } from '../User/User'

export interface WebSocketsServiceInterface {
  sendUserRoleChangedEvent(user: User, fromRole: RoleName, toRole: RoleName): Promise<void>
}