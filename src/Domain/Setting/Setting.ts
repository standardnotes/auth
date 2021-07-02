import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../User/User'

@Entity({ name: 'settings' })
@Index('index_settings_on_name_and_user_uuid', ['name', 'user'])
export class Setting {
  static readonly ENCRYPTION_VERSION_UNENCRYPTED = 0
  static readonly ENCRYPTION_VERSION_DEFAULT = 1
  static readonly ENCRYPTION_VERSION_CLIENT_ENCODED_AND_SERVER_ENCRYPTED = 2

  @PrimaryGeneratedColumn('uuid')
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
    default: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
  })
  serverEncryptionVersion: number

  @Column({
    name: 'created_at',
    type: 'bigint',
  })
  createdAt: number

  @Column({
    name: 'updated_at',
    type: 'bigint',
  })
  updatedAt: number

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
