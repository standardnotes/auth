import { RoleName } from '@standardnotes/auth'
import { User } from '../User/User'

export interface ClientServiceInterface {
  sendUserRoleChangedEvent(user: User, role: RoleName): Promise<void>
}
