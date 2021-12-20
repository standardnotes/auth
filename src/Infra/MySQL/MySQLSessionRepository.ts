import * as dayjs from 'dayjs'

import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'

import { Session } from '../../Domain/Session/Session'
import { SessionRepositoryInterface } from '../../Domain/Session/SessionRepositoryInterface'

@injectable()
@EntityRepository(Session)
export class MySQLSessionRepository extends Repository<Session> implements SessionRepositoryInterface {
  async updateHashedTokens(uuid: string, hashedAccessToken: string, hashedRefreshToken: string): Promise<void> {
    await this.createQueryBuilder('s')
      .update()
      .set({
        hashedAccessToken,
        hashedRefreshToken,
      })
      .where('s.uuid = :uuid', { uuid })
      .execute()
  }

  async updatedTokenExpirationDates(uuid: string, accessExpiration: Date, refreshExpiration: Date): Promise<void> {
    await this.createQueryBuilder('s')
      .update()
      .set({
        accessExpiration,
        refreshExpiration,
      })
      .where('s.uuid = :uuid', { uuid })
      .execute()
  }

  async findAllByRefreshExpirationAndUserUuid(userUuid: string): Promise<Session[]> {
    return this.createQueryBuilder('s')
      .where(
        's.refresh_expiration > :refresh_expiration AND s.user_uuid = :user_uuid',
        { refresh_expiration: dayjs.utc().toDate(), user_uuid: userUuid }
      )
      .getMany()
  }

  async findOneByUuidAndUserUuid(uuid: string, userUuid: string): Promise<Session | undefined> {
    return this.createQueryBuilder('s')
      .where('s.uuid = :uuid AND s.user_uuid = :user_uuid', { uuid, user_uuid: userUuid })
      .getOne()
  }

  async deleteOneByUuid(uuid: string): Promise<void> {
    await this.createQueryBuilder('s')
      .delete()
      .where('s.uuid = :uuid', { uuid })
      .execute()
  }

  async findOneByUuid(uuid: string): Promise<Session | undefined> {
    return this.createQueryBuilder('s')
      .where('s.uuid = :uuid', { uuid })
      .getOne()
  }

  async findAllByUserUuid(userUuid: string): Promise<Array<Session>> {
    return this.createQueryBuilder('s')
      .where(
        's.user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
        }
      )
      .getMany()
  }

  async deleteAllByUserUuid(userUuid: string, currentSessionUuid: string): Promise<void> {
    await this.createQueryBuilder('s')
      .delete()
      .where(
        's.user_uuid = :user_uuid AND s.uuid != :current_session_uuid',
        {
          user_uuid: userUuid,
          current_session_uuid: currentSessionUuid,
        }
      )
      .execute()
  }
}
