import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  uuid: string

  @Column({
    name: 'user_uuid',
    length: 255,
    nullable: true,
  })
  @Index('index_sessions_on_user_uuid')
  userUuid: string

  @Column({
    name: 'hashed_access_token',
    length: 255,
  })
  hashedAccessToken: string

  @Column({
    name: 'hashed_refresh_token',
    length: 255,
  })
  hashedRefreshToken: string

  @Column({
    name: 'access_expiration',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP',
  })
  accessExpiration: Date

  @Column({
    name: 'refresh_expiration',
    type: 'datetime',
  })
  refreshExpiration: Date

  @Column({
    name: 'api_version',
    length: 255,
    nullable: true,
  })
  apiVersion: string

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent: string | null

  @Column({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date

  @Column({
    name: 'updated_at',
    type: 'datetime',
  })
  @Index('index_sessions_on_updated_at')
  updatedAt: Date
}
