import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { User } from '../User/User'

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryColumn({
    length: 36
  })
  uuid: string

  @Column({
    length: 255
  })
  name: string

  @Column({
    length: 255
  })
  value: string

  @Column({
    name: 'created_at',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP'
  })
  createdAt: Date

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date

  @ManyToOne(
    /* istanbul ignore next */
    () => User, user => user.settings, { onDelete: 'CASCADE', nullable: false }
  )
  user: Promise<User>
}
