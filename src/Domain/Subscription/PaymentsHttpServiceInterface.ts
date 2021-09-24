export interface PaymentsHttpServiceInterface {
  getUser(extensionKey: string): Promise<
    {
      id: string,
      extension_server_key: string,
      email: string,
      subscription: {
        canceled: boolean,
        created_at: string,
        updated_at: string,
        active_until: string,
      },
    }
    | undefined
  >
}
