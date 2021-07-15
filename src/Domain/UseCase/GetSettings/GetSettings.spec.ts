import 'reflect-metadata'

import { MfaSetting } from '@standardnotes/auth'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Setting } from '../../Setting/Setting'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'

import { GetSettings } from './GetSettings'

describe('GetSettings', () => {
  let settingRepository: SettingRepositoryInterface
  let settingProjector: SettingProjector
  let setting: Setting
  let mfaSetting: Setting

  const createUseCase = () => new GetSettings(settingRepository, settingProjector)

  beforeEach(() => {
    setting = {
      name: 'test',
      updatedAt: 345,
    } as jest.Mocked<Setting>
    mfaSetting = { name: MfaSetting.MfaSecret, updatedAt: 122 } as jest.Mocked<Setting>

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findAllByUserUuid = jest.fn().mockReturnValue([ setting, mfaSetting ])

    settingProjector = {} as jest.Mocked<SettingProjector>
    settingProjector.projectManySimple = jest.fn().mockReturnValue([{ foo: 'bar' }])
  })

  it('should return all user settings except mfa', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3' })).toEqual({
      success: true,
      userUuid: '1-2-3',
      settings: [{ foo: 'bar' }],
    })

    expect(settingProjector.projectManySimple).toHaveBeenCalledWith([ setting ])
  })

  it('should return all user settings of certain name', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test', allowMFARetrieval: true })).toEqual({
      success: true,
      userUuid: '1-2-3',
      settings: [{ foo: 'bar' }],
    })

    expect(settingProjector.projectManySimple).toHaveBeenCalledWith([ setting ])
  })

  it('should return all user settings updated after', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', allowMFARetrieval: true, updatedAfter: 123 })).toEqual({
      success: true,
      userUuid: '1-2-3',
      settings: [{ foo: 'bar' }],
    })

    expect(settingProjector.projectManySimple).toHaveBeenCalledWith([ setting ])
  })

  it('should return all user settings with mfa if explicit', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', allowMFARetrieval: true })).toEqual({
      success: true,
      userUuid: '1-2-3',
      settings: [{ foo: 'bar' }],
    })

    expect(settingProjector.projectManySimple).toHaveBeenCalledWith([ setting, mfaSetting ])
  })
})
