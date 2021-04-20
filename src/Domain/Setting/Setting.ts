import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { User } from '../User/User'
import { v4 as uuidv4 } from 'uuid'
import dayjs = require('dayjs')
import { SettingProps } from './SettingProps'

@Entity({ name: 'settings' })
@Index('index_settings_on_name_and_user_uuid', ['name', 'user'])
export class Setting {
  static readonly DEFAULT_ENCRYPTION_VERSION = 0

  static create(props: SettingProps, user: User): Setting {
    const uuid = uuidv4()

    const { 
      name, 
      value, 
      serverEncryptionVersion = Setting.DEFAULT_ENCRYPTION_VERSION, 
    } = props

    const setting: Setting = {
      uuid,
      user: (async () => user)(),
      name,
      value,
      serverEncryptionVersion,
      createdAt: dayjs.utc().toDate(),
      updatedAt: dayjs.utc().toDate(),
    }

    return Object.assign(new Setting(), setting)
  }

  static async createReplacement(
    original: Setting, 
    props: SettingProps,
  ): Promise<Setting> {
    const { uuid, user } = original
    
    return Object.assign(Setting.create(props, await user), {
      uuid,
    })
  }

  @PrimaryColumn({
    length: 36,
  })
  uuid: string

  @Column({
    length: 255,
  })
  name: string

  @Column({
    length: 255,
  })
  value: string

  @Column({
    name: 'server_encryption_version',
    type: 'tinyint',
    default: Setting.DEFAULT_ENCRYPTION_VERSION,
  })
  serverEncryptionVersion: number

  @Column({
    name: 'created_at',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @ManyToOne(
    /* istanbul ignore next */
    () => User,
    /* istanbul ignore next */
    user => user.settings,
    /* istanbul ignore next */
    { onDelete: 'CASCADE', nullable: false }
  )
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: Promise<User>
}
