import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Role } from '../Role/Role'

@Entity({ name: 'offline_user_subscriptions' })
export class OfflineUserSubscription {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string

  @Column({
    length: 255,
  })
  @Index('email')
  email!: string

  @Column({
    name: 'plan_name',
    length: 255,
    nullable: false,
  })
  planName!: string

  @Column({
    name: 'ends_at',
    type: 'bigint',
  })
  endsAt!: number

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

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  cancelled!: boolean

  @Column({
    name: 'subscription_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  subscriptionId!: number | null

  @ManyToMany(
    /* istanbul ignore next */
    () => Role,
    /* istanbul ignore next */
    { lazy: true, eager: false },
  )
  @JoinTable({
    name: 'offline_user_roles',
    joinColumn: {
      name: 'offline_user_subscription_uuid',
      referencedColumnName: 'uuid',
    },
    inverseJoinColumn: {
      name: 'role_uuid',
      referencedColumnName: 'uuid',
    },
  })
  roles: Promise<Array<Role>> | undefined
}
