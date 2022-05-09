import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  declare uuid: string

  @Column({
    name: 'user_uuid',
    length: 255,
    nullable: true,
  })
  @Index('index_sessions_on_user_uuid')
  declare userUuid: string

  @Column({
    name: 'hashed_access_token',
    length: 255,
  })
  declare hashedAccessToken: string

  @Column({
    name: 'hashed_refresh_token',
    length: 255,
  })
  declare hashedRefreshToken: string

  @Column({
    name: 'access_expiration',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP',
  })
  declare accessExpiration: Date

  @Column({
    name: 'refresh_expiration',
    type: 'datetime',
  })
  declare refreshExpiration: Date

  @Column({
    name: 'api_version',
    length: 255,
    nullable: true,
  })
  declare apiVersion: string

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  declare userAgent: string | null

  @Column({
    name: 'created_at',
    type: 'datetime',
  })
  declare createdAt: Date

  @Column({
    name: 'updated_at',
    type: 'datetime',
  })
  @Index('index_sessions_on_updated_at')
  declare updatedAt: Date

  @Column({
    name: 'readonly_access',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 0,
  })
  declare readonlyAccess: boolean
}
