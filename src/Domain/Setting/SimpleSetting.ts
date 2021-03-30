import { Uuid } from '../Uuid/Uuid'
import { Setting } from './Setting'

export type SimpleSetting = Omit<Setting, 
  'user' | 
  'createdAt' | 
  'updatedAt' | 
  'serverEncryptionVersion'
> & { userUuid: Uuid }
