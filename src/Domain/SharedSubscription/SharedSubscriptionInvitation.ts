import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { InviteeIdentifierType } from './InviteeIdentifierType'
import { InviterIdentifierType } from './InviterIdentifierType'
import { InvitationStatus } from './InvitationStatus'

@Entity({ name: 'shared_subscription_invitations' })
@Index('invitee_and_status', ['inviteeIdentifier', 'status'])
export class SharedSubscriptionInvitation {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string

  @Column({
    length: 255,
    type: 'varchar',
    name: 'inviter_identifier',
  })
  @Index('inviter_identifier')
  inviterIdentifier!: string

  @Column({
    length: 24,
    type: 'varchar',
    name: 'inviter_identifier_type',
  })
  inviterIdentifierType!: InviterIdentifierType

  @Column({
    length: 255,
    type: 'varchar',
    name: 'invitee_identifier',
  })
  @Index('invitee_identifier')
  inviteeIdentifier!: string

  @Column({
    length: 24,
    type: 'varchar',
    name: 'invitee_identifier_type',
  })
  inviteeIdentifierType!: InviteeIdentifierType

  @Column({
    length: 255,
    type: 'varchar',
  })
  status!: InvitationStatus

  @Column({
    name: 'subscription_id',
    type: 'int',
    width: 11,
  })
  subscriptionId!: number

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
}
