import { StatisticName } from './StatisticName'

export interface StatisticCollectorInterface {
  recordStatistic(statisticName: StatisticName, attributes: { [keys: string]: boolean | number | string }): void
}
