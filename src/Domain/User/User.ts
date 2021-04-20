import { Column, Entity, Index, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from 'typeorm'
import { RevokedSession } from '../Session/RevokedSession'
import { Role } from '../Role/Role'
import { Setting } from '../Setting/Setting'

@Entity({ name: 'users' })
export class User {
  private readonly SESSIONS_PROTOCOL_VERSION = 4
  static readonly PASSWORD_HASH_COST = 11
  static readonly DEFAULT_ENCRYPTION_VERSION = 1

  @PrimaryColumn({
    length: 36,
  })
  uuid: string

  @Column({
    length: 255,
    nullable: true,
  })
  version: string

  @Column({
    length: 255,
    nullable: true,
  })
  @Index('index_users_on_email')
  email: string

  @Column({
    name: 'pw_nonce',
    length: 255,
    nullable: true,
  })
  pwNonce: string

  @Column({
    name: 'encrypted_server_key',
    length: 255,
    type: 'varchar',
    nullable: true,
  })
  encryptedServerKey: string | null

  @Column({
    name: 'server_encryption_version',
    type: 'tinyint',
    default: 0,
  })
  serverEncryptionVersion: number

  @Column({
    name: 'kp_created',
    length: 255,
    nullable: true,
  })
  kpCreated: string

  @Column({
    name: 'kp_origination',
    length: 255,
    nullable: true,
  })
  kpOrigination: string

  @Column({
    name: 'pw_cost',
    width: 11,
    type: 'int',
    nullable: true,
  })
  pwCost: number

  @Column({
    name: 'pw_key_size',
    width: 11,
    type: 'int',
    nullable: true,
  })
  pwKeySize: number

  @Column({
    name: 'pw_salt',
    length: 255,
    nullable: true,
  })
  pwSalt: string

  @Column({
    name: 'pw_alg',
    length: 255,
    nullable: true,
  })
  pwAlg: string

  @Column({
    name: 'pw_func',
    length: 255,
    nullable: true,
  })
  pwFunc: string

  @Column({
    name: 'encrypted_password',
    length: 255,
  })
  encryptedPassword: string

  @Column({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date

  @Column({
    name: 'updated_at',
    type: 'datetime',
  })
  updatedAt: Date

  @Column({
    name: 'locked_until',
    type: 'datetime',
    nullable: true,
  })
  lockedUntil: Date | null

  @Column({
    name: 'num_failed_attempts',
    type: 'int',
    width: 11,
    nullable: true,
  })
  numberOfFailedAttempts: number | null

  @Column({
    name: 'updated_with_user_agent',
    type: 'text',
    nullable: true,
  })
  updatedWithUserAgent: string | null

  @OneToMany(
    /* istanbul ignore next */
    () => RevokedSession,
    /* istanbul ignore next */
    revokedSession => revokedSession.user
  )
  revokedSessions: Promise<RevokedSession[]>

  @OneToMany(
    /* istanbul ignore next */
    () => Setting,
    /* istanbul ignore next */
    setting => setting.user
  )
  settings: Promise<Setting[]>

  @ManyToMany(
    /* istanbul ignore next */
    () => Role
  )
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'user_uuid',
      referencedColumnName: 'uuid',
    },
    inverseJoinColumn: {
      name: 'role_uuid',
      referencedColumnName: 'uuid',
    },
  })
  roles: Promise<Array<Role>>

  supportsSessions(): boolean {
    return parseInt(this.version) >= this.SESSIONS_PROTOCOL_VERSION
  }
}
