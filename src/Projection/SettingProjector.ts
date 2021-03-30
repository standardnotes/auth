import { injectable } from 'inversify'

import { Setting } from '../Domain/Setting/Setting'
import { SimpleSetting } from '../Domain/Setting/SimpleSetting'

@injectable()
export class SettingProjector {
  async projectSimple(setting: Setting): Promise<SimpleSetting> {
    const { 
      user,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updatedAt,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      serverEncryptionVersion,
      ...rest 
    } = setting

    return {
      ...rest,
      userUuid: (await user).uuid
    }
  }
  async projectManySimple(settings: Setting[]): Promise<SimpleSetting[]> {
    return Promise.all(
      settings.map(async (setting) => {
        return this.projectSimple(setting)
      })
    )
  }
}
