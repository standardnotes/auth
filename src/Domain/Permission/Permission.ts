import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm'
import { Role } from '../Role/Role'

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryColumn({
    length: 36
  })
  uuid: string

  @Column({
    length: 255
  })
  @Index('index_permissions_on_name', { unique: true })
  name: string

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

  @ManyToMany(
    /* istanbul ignore next */
    () => Role
  )
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
        name: 'permission_uuid',
        referencedColumnName: 'uuid'
    },
    inverseJoinColumn: {
        name: 'role_uuid',
        referencedColumnName: 'uuid'
    },
  })
  roles: Promise<Array<Role>>
}
