export interface PaymentsSubscriptionHttpServiceInterface {
  getUserSubscription(userUuid: string): Promise<{ active_until: string, canceled: boolean, created_at: string, updated_at: string } | undefined>
}
