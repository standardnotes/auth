export interface ItemHttpServiceInterface {
  getUserMFASecret(userUuid: string): Promise<{ secret: string, extensionUuid: string } | undefined>
}
