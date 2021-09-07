import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../User/User'

@Entity({ name: 'user_subscriptions' })
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  uuid: string

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
  @Index('updated_at')
  updatedAt: number

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  cancelled: boolean

  @ManyToOne(
    /* istanbul ignore next */
    () => User,
    /* istanbul ignore next */
    user => user.subscriptions,
    /* istanbul ignore next */
    { onDelete: 'CASCADE', nullable: false }
  )
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: Promise<User>
}
