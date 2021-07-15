import 'reflect-metadata'

import { Setting } from '../Domain/Setting/Setting'

import { SettingProjector } from './SettingProjector'

describe('SettingProjector', () => {
  let setting: Setting

  const createProjector = () => new SettingProjector()

  beforeEach(() => {
    setting = {
      uuid: 'setting-uuid',
      name: 'setting-name',
      value: 'setting-value',
      serverEncryptionVersion: 1,
      createdAt: 1,
      updatedAt: 2,
    } as jest.Mocked<Setting>
  })

  it('should create a simple projection of a setting', async () => {
    const projection = await createProjector().projectSimple(setting)
    expect(projection).toEqual({
      uuid: 'setting-uuid',
      name: 'setting-name',
      value: 'setting-value',
      createdAt: 1,
      updatedAt: 2,
    })
  })
  it('should create a simple projection of list of settings', async () => {
    const projection = await createProjector().projectManySimple([setting])
    expect(projection).toEqual([
      {
        uuid: 'setting-uuid',
        name: 'setting-name',
        value: 'setting-value',
        createdAt: 1,
        updatedAt: 2,
      },
    ])
  })
})
