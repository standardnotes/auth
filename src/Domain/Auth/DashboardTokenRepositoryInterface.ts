import { DashboardToken } from './DashboardToken'

export interface DashboardTokenRepositoryInterface {
  save(dashboardToken: DashboardToken): Promise<void>
  getUserEmailByToken(token: string): Promise<string | undefined>
}
