import 'reflect-metadata'
import { StatisticName } from '../../Domain/Statistic/StatisticName'

import { NewRelicStatisticCollector } from './NewRelicStatisticCollector'

describe('NewRelicStatisticCollector', () => {
  let newrelicStatisticRecordingFunction: (eventType: string, attributes: { [keys: string]: boolean | number | string }) => void

  const createCollector = () => new NewRelicStatisticCollector(newrelicStatisticRecordingFunction)

  beforeEach(() => {
    newrelicStatisticRecordingFunction = jest.fn()
  })

  it('should record statistic', () => {
    createCollector().recordStatistic(StatisticName.UserRegistered, { foo: 'bar' })

    expect(newrelicStatisticRecordingFunction).toHaveBeenCalledWith('user:registered', { foo: 'bar' })
  })
})
