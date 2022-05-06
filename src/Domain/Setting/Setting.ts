import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { User } from '../User/User'

@Entity({ name: 'settings' })
@Index('index_settings_on_name_and_user_uuid', ['name', 'user'])
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string

  @Column({
    length: 255,
  })
  name!: string

  @Column({
    type: 'text',
    nullable: true,
  })
  value!: string | null

  @Column({
    name: 'server_encryption_version',
    type: 'tinyint',
    default: EncryptionVersion.Unencrypted,
  })
  serverEncryptionVersion!: number

  @Column({
    name: 'created_at',
    type: 'bigint',
  })
  createdAt!: number

  @Column({
    name: 'updated_at',
    type: 'bigint',
  })
  @Index('index_settings_on_updated_at')
  updatedAt!: number

  @ManyToOne(
    /* istanbul ignore next */
    () => User,
    /* istanbul ignore next */
    (user) => user.settings,
    /* istanbul ignore next */
    { onDelete: 'CASCADE', nullable: false },
  )
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: Promise<User> | undefined

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  sensitive!: boolean
}
