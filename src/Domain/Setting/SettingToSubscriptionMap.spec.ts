import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { SettingName } from '@standardnotes/settings'

import { SettingToSubscriptionMap } from './SettingToSubscriptionMap'

describe('SettingToSubscriptionMap', () => {
  const createMap = () => new SettingToSubscriptionMap()

  it('should return the default set of setting values for a core subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.CorePlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return the default set of setting values for a plus subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.PlusPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual(['EMAIL_BACKUP'])
  })

  it('should return the default set of setting values for a pro subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.ProPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual(['EMAIL_BACKUP'])
  })

  it('should return undefined set of setting values for an undefined subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName('foobar' as SubscriptionName)

    expect(settings).toBeUndefined()
  })
})
