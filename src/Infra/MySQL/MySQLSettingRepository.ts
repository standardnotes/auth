import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { Setting } from '../../Domain/Setting/Setting'
import { SettingRepositoryInterface } from '../../Domain/Setting/SettingRepositoryInterface'
import { CreateOrReplaceSettingDto } from '../../Domain/Setting/CreateOrReplaceSettingDto'
import { CreateOrReplaceSettingStatus } from '../../Domain/Setting/CreateOrReplaceSettingStatus'
import { DeleteSettingDto } from '../../Domain/UseCase/DeleteSetting/DeleteSettingDto'
import { SettingFactory } from '../../Domain/Setting/SettingFactory'

@injectable()
@EntityRepository(Setting)
export class MySQLSettingRepository extends Repository<Setting> implements SettingRepositoryInterface {
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
  async createOrReplace(dto: CreateOrReplaceSettingDto, settingFactory: SettingFactory):
  Promise<CreateOrReplaceSettingStatus> {
    const { user, props } = dto

    const existing = await this.findOneByNameAndUserUuid(props.name, user.uuid)

    if (existing === undefined) {
      await this.save(await settingFactory.create(props, user))

      return 'created'
    }

    await this.save(await settingFactory.createReplacement(existing, props))

    return 'replaced'
  }
  async deleteByUserUuid({
    settingName,
    userUuid,
  }: DeleteSettingDto): Promise<void> {
    await this.createQueryBuilder('setting')
      .delete()
      .where(
        'name = :name AND user_uuid = :user_uuid',
        {
          user_uuid: userUuid,
          name: settingName,
        }
      )
      .execute()
  }
}
