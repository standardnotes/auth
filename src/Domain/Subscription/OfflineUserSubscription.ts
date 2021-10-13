import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'offline_user_subscriptions' })
export class OfflineUserSubscription {
  @PrimaryGeneratedColumn('uuid')
  uuid: string

  @Column({
    length: 255,
  })
  @Index('email')
  email: string

  @Column({
    name: 'plan_name',
    length: 255,
    nullable: false,
  })
  planName: string

  @Column({
    name: 'ends_at',
    type: 'bigint',
  })
  endsAt: number

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

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  cancelled: boolean
}
