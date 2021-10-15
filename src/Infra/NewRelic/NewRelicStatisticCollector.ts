import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { StatisticCollectorInterface } from '../../Domain/Statistic/StatisticCollectorInterface'
import { StatisticName } from '../../Domain/Statistic/StatisticName'

@injectable()
export class NewRelicStatisticCollector implements StatisticCollectorInterface {
  constructor (
    @inject(TYPES.StatisticRecordingFunction) private newrelicStatisticRecordingFunction: (eventType: string, attributes: { [keys: string]: boolean | number | string }) => void
  ) {
  }

  recordStatistic(statisticName: StatisticName, attributes: { [keys: string]: string | number | boolean }): void {
    this.newrelicStatisticRecordingFunction(statisticName, attributes)
  }
}
