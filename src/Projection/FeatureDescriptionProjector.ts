import { FeatureDescription } from '@standardnotes/features'
import { TimerInterface } from '@standardnotes/time'
import { inject, injectable } from 'inversify'

import TYPES from '../Bootstrap/Types'
import { FeatureDescriptionProjection } from '../Domain/Feature/FeatureDescriptionProjection'

import { ProjectorInterface } from './ProjectorInterface'

@injectable()
export class FeatureDescriptionProjector implements ProjectorInterface<FeatureDescription> {
  constructor(
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  projectSimple(_featureDescription: FeatureDescription): Record<string, unknown> {
    throw Error('not implemented')
  }

  projectCustom(_type: string, _featureDescription: FeatureDescription): Record<string, unknown> {
    throw Error('not implemented')
  }

  projectFull(featureDescription: FeatureDescription): FeatureDescriptionProjection {
    return {
      ...featureDescription,
      expires_at: featureDescription.expires_at ? this.timer.convertMicrosecondsToMilliseconds(featureDescription.expires_at) : undefined,
    }
  }
}
