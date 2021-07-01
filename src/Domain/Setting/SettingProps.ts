import { Setting } from './Setting'

export type SettingProps = Omit<Setting,
  'uuid' |
  'user' |
  'createdAt' |
  'updatedAt' |
  'serverEncryptionVersion'
> & {
  uuid?: string,
  createdAt?: number,
  updatedAt?: number,
  serverEncryptionVersion?: number
}
