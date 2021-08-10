import 'reflect-metadata'
import { SettingProjector } from '../../../Projection/SettingProjector'
import { Setting } from '../../Setting/Setting'
import { SettingServiceInterface } from '../../Setting/SettingServiceInterface'

import { GetSetting } from './GetSetting'

describe('GetSetting', () => {
  let settingProjector: SettingProjector
  let setting: Setting
  let settingService: SettingServiceInterface

  const createUseCase = () => new GetSetting(settingProjector, settingService)

  beforeEach(() => {
    setting = {} as jest.Mocked<Setting>

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.findSetting = jest.fn().mockReturnValue(setting)

    settingProjector = {} as jest.Mocked<SettingProjector>
    settingProjector.projectSimple = jest.fn().mockReturnValue({ foo: 'bar' })
  })

  it('should find a setting for user', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: true,
      userUuid: '1-2-3',
      setting: { foo: 'bar' },
    })
  })

  it('should not get a setting for user if it does not exist', async () => {
    settingService.findSetting = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'test' })).toEqual({
      success: false,
      error: {
        message: 'Setting test for user 1-2-3 not found!',
      },
    })
  })

  it('should not find an mfa setting for user', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'MFA_SECRET' })).toEqual({
      success: false,
      error: {
        message: 'Setting MFA_SECRET for user 1-2-3 not found!',
      },
    })
  })

  it('should find an mfa setting for user if explicitly told to', async () => {
    expect(await createUseCase().execute({ userUuid: '1-2-3', settingName: 'MFA_SECRET', allowMFARetrieval: true })).toEqual({
      success: true,
      userUuid: '1-2-3',
      setting: { foo: 'bar' },
    })
  })
})
