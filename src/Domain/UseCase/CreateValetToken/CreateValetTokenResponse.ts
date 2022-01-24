export type CreateValetTokenResponse = {
  success: false,
  reason: 'no-subscription' | 'expired-subscription'
} | {
  success: true,
  valetToken: string,
}
