import 'reflect-metadata'

import { TimerInterface } from '@standardnotes/time'
import { FeatureDescription, FeatureIdentifier, PermissionName } from '@standardnotes/features'

import { FeatureDescriptionProjector } from './FeatureDescriptionProjector'

describe('FeatureDescriptionProjector', () => {
  let featureDescription: FeatureDescription
  let timer: TimerInterface

  const createProjector = () => new FeatureDescriptionProjector(timer)

  beforeEach(() => {
    featureDescription = {
      name: 'test',
      identifier: FeatureIdentifier.BoldEditor,
      permission_name: PermissionName.BoldEditor,
      version: 'test',
      description: 'test',
      url: 'test',
      download_url: 'test',
      marketing_url: 'test',
      expires_at: 123123,
    } as jest.Mocked<FeatureDescription>

    timer = {} as jest.Mocked<TimerInterface>
    timer.convertMicrosecondsToSeconds = jest.fn().mockReturnValue(123)
  })

  it('should create a full projection', () => {
    const projection = createProjector().projectFull(featureDescription)
    expect(projection).toMatchObject({
      name: 'test',
      identifier: FeatureIdentifier.BoldEditor,
      permission_name: PermissionName.BoldEditor,
      version: 'test',
      description: 'test',
      url: 'test',
      download_url: 'test',
      marketing_url: 'test',
      expires_at: 123,
    })
  })

  it('should create a full projection - undefinedx expires_at', () => {
    delete featureDescription.expires_at

    const projection = createProjector().projectFull(featureDescription)
    expect(projection).toMatchObject({
      name: 'test',
      identifier: FeatureIdentifier.BoldEditor,
      permission_name: PermissionName.BoldEditor,
      version: 'test',
      description: 'test',
      url: 'test',
      download_url: 'test',
      marketing_url: 'test',
    })
  })

  it('should throw error on custom projection', () => {
    let error = null
    try {
      createProjector().projectCustom('test', featureDescription)
    } catch (e) {
      error = e
    }
    expect(error.message).toEqual('not implemented')
  })

  it('should throw error on not implemetned simple projection', () => {
    let error = null
    try {
      createProjector().projectSimple(featureDescription)
    } catch (e) {
      error = e
    }
    expect(error.message).toEqual('not implemented')
  })
})
