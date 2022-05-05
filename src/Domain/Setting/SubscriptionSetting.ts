import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'
import { UserSubscription } from '../Subscription/UserSubscription'

@Entity({ name: 'subscription_settings' })
@Index('index_settings_on_name_and_user_subscription_uuid', ['name', 'userSubscription'])
export class SubscriptionSetting {
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
  @Index('index_subcsription_settings_on_updated_at')
  updatedAt!: number

  @ManyToOne(
    /* istanbul ignore next */
    () => UserSubscription,
    /* istanbul ignore next */
    (userSubscription) => userSubscription.subscriptionSettings,
    /* istanbul ignore next */
    { onDelete: 'CASCADE', nullable: false },
  )
  @JoinColumn({ name: 'user_subscription_uuid', referencedColumnName: 'uuid' })
  userSubscription!: Promise<UserSubscription>

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  sensitive!: boolean
}
