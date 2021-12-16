import 'reflect-metadata'
import { Setting } from '../../Setting/Setting'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'

import { MuteFailedBackupsEmails } from './MuteFailedBackupsEmails'

describe('MuteFailedBackupsEmails', () => {
  let settingRepository: SettingRepositoryInterface

  const createUseCase = () => new MuteFailedBackupsEmails(settingRepository)

  beforeEach(() => {
    const setting = {} as jest.Mocked<Setting>

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByUuidAndName = jest.fn().mockReturnValue(setting)
    settingRepository.save = jest.fn()
  })

  it('should not succeed if extension setting is not found', async () => {
    settingRepository.findOneByUuidAndName = jest.fn().mockReturnValue(undefined)

    expect(await createUseCase().execute({ settingUuid: '1-2-3' }))
      .toEqual({ success: false, message: 'Could not find setting setting.' })
  })

  it('should update mute email setting on extension setting', async () => {
    expect(await createUseCase().execute({ settingUuid: '1-2-3' }))
      .toEqual({ success: true, message: 'These emails have been muted.' })

    expect(settingRepository.save).toHaveBeenCalledWith({
      value: 'muted',
    })
  })
})
