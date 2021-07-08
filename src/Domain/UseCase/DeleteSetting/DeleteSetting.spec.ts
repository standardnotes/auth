import 'reflect-metadata'

import { TimerInterface } from '@standardnotes/time'

import { Setting } from '../../Setting/Setting'
import { SettingRepositoryInterface } from '../../Setting/SettingRepositoryInterface'

import { DeleteSetting } from './DeleteSetting'

describe('DeleteSetting', () => {
  let setting: Setting
  let settingRepository: SettingRepositoryInterface
  let timer: TimerInterface

  const createUseCase = () => new DeleteSetting(settingRepository, timer)

  beforeEach(() => {
    setting = {} as jest.Mocked<Setting>

    settingRepository = {} as jest.Mocked<SettingRepositoryInterface>
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(setting)
    settingRepository.deleteByUserUuid = jest.fn()
    settingRepository.save = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(1)
  })

  it('should delete a setting by name and user uuid', async () => {
    await createUseCase().execute({
      settingName: 'test',
      userUuid: '1-2-3',
    })

    expect(settingRepository.deleteByUserUuid).toHaveBeenCalledWith({ 'settingName': 'test', 'userUuid': '1-2-3' })
  })

  it('should not delete a setting by name and user uuid if not found', async () => {
    settingRepository.findOneByNameAndUserUuid = jest.fn().mockReturnValue(undefined)

    await createUseCase().execute({
      settingName: 'test',
      userUuid: '1-2-3',
    })

    expect(settingRepository.deleteByUserUuid).not.toHaveBeenCalled()
  })

  it('should soft delete a setting by name and user uuid', async () => {
    await createUseCase().execute({
      settingName: 'test',
      userUuid: '1-2-3',
      softDelete: true,
    })

    expect(settingRepository.save).toHaveBeenCalledWith({
      'updatedAt': 1,
      'value': null,
    })
  })
})
