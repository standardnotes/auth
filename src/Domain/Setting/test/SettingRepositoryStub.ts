import { Setting } from '../Setting'
import { SettingRepositoryInterface } from '../SettingRepositoryInterface'

export class SettingRepostioryStub implements SettingRepositoryInterface {
  constructor(private settings: Setting[]) {}

  async findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined> {
    for (const setting of this.settings) {
      if (setting.name === name && (await setting.user).uuid === userUuid) {
        return setting
      }
    }
    return undefined
  }
  async findAllByUserUuid(userUuid: string): Promise<Setting[]> {
    const found = []
    for (const setting of this.settings) {
      if ((await setting.user).uuid === userUuid) {
        found.push(setting)
      }
    }
    return found
  }
}
