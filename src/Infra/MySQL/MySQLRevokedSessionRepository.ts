import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { RevokedSession } from '../../Domain/Session/RevokedSession'
import { RevokedSessionRepositoryInterface } from '../../Domain/Session/RevokedSessionRepositoryInterface'

@injectable()
@EntityRepository(RevokedSession)
export class MySQLRevokedSessionRepository extends Repository<RevokedSession> implements RevokedSessionRepositoryInterface {
  async findAllByUserUuid(userUuid: string): Promise<RevokedSession[]> {
    return this.createQueryBuilder('revoked_session')
      .where(
        'revoked_session.user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
        }
      )
      .getMany()
  }

  async findOneByUuid(uuid: string): Promise<RevokedSession | undefined> {
    return this.createQueryBuilder('revoked_session')
      .where('revoked_session.uuid = :uuid', { uuid })
      .getOne()
  }
}
