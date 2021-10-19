import { AxiosInstance } from 'axios'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { StatisticCollectorInterface } from '../../Domain/Statistic/StatisticCollectorInterface'
import { StatisticName } from '../../Domain/Statistic/StatisticName'

@injectable()
export class NewRelicStatisticCollector implements StatisticCollectorInterface {
  constructor (
    @inject(TYPES.HTTPClient) private httpClient: AxiosInstance,
  ) {
  }

  async recordStatistic(statisticName: StatisticName, attributes: { [keys: string]: string | number | boolean }): void {
    await this.httpClient.request({
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }
}
