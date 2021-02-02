import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm'
import { Permission } from '../Permission/Permission'
import { User } from '../User/User'

@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn({
    length: 36
  })
  uuid: string

  @Column({
    length: 255
  })
  @Index('index_roles_on_name', { unique: true })
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
    () => User
  )
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
        name: 'role_uuid',
        referencedColumnName: 'uuid'
    },
    inverseJoinColumn: {
        name: 'user_uuid',
        referencedColumnName: 'uuid'
    },
  })
  users: Promise<Array<User>>

  @ManyToMany(
    /* istanbul ignore next */
    () => Permission
  )
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
        name: 'role_uuid',
        referencedColumnName: 'uuid'
    },
    inverseJoinColumn: {
        name: 'permission_uuid',
        referencedColumnName: 'uuid'
    },
  })
  permissions: Promise<Array<Permission>>
}
