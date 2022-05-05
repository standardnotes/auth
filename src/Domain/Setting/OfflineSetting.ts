import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

@Entity({ name: 'offline_settings' })
@Index('index_offline_settings_on_name_and_email', ['name', 'email'])
export class OfflineSetting {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string

  @Column({
    length: 255,
  })
  email!: string

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
  updatedAt!: number
}
