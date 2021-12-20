import { SettingName } from '@standardnotes/settings'
import { ReadStream } from 'fs'
import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { Setting } from '../../Domain/Setting/Setting'
import { SettingRepositoryInterface } from '../../Domain/Setting/SettingRepositoryInterface'
import { DeleteSettingDto } from '../../Domain/UseCase/DeleteSetting/DeleteSettingDto'

@injectable()
@EntityRepository(Setting)
export class MySQLSettingRepository extends Repository<Setting> implements SettingRepositoryInterface {
  async findOneByUuidAndNames(uuid: string, names: SettingName[]): Promise<Setting | undefined> {
    return this.createQueryBuilder('setting')
      .where(
        'setting.uuid = :uuid AND setting.name IN (:...names)',
        {
          names,
          uuid,
        }
      )
      .getOne()
  }

  async streamAllByNameAndValue(name: SettingName, value: string): Promise<ReadStream> {
    return this.createQueryBuilder('setting')
      .where(
        'setting.name = :name AND setting.value = :value',
        {
          name,
          value,
        }
      )
      .orderBy('updated_at', 'ASC')
      .stream()
  }

  async findOneByUuid(uuid: string): Promise<Setting | undefined> {
    return this.createQueryBuilder('setting')
      .where(
        'setting.uuid = :uuid',
        {
          uuid,
        }
      )
      .getOne()
  }

  async findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined> {
    return this.createQueryBuilder('setting')
      .where(
        'setting.name = :name AND setting.user_uuid = :user_uuid',
        {
          name,
          user_uuid: userUuid,
        }
      )
      .getOne()
  }

  async findLastByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined> {
    const settings = await this.createQueryBuilder('setting')
      .where(
        'setting.name = :name AND setting.user_uuid = :user_uuid',
        {
          name,
          user_uuid: userUuid,
        }
      )
      .orderBy('setting.updated_at', 'DESC')
      .limit(1)
      .getMany()

    return settings.pop()
  }

  async findAllByUserUuid(userUuid: string): Promise<Setting[]> {
    return this.createQueryBuilder('setting')
      .where(
        'setting.user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
        }
      )
      .getMany()
  }

  async deleteByUserUuid({
    settingName,
    userUuid,
  }: DeleteSettingDto): Promise<void> {
    await this.createQueryBuilder('setting')
      .delete()
      .where(
        'setting.name = :name AND setting.user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
          name: settingName,
        }
      )
      .execute()
  }
}
