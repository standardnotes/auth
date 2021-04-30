export type UpdateSettingResponse = {
  success: true,
  statusCode: number,
} | {
  success: false,
  error: {
    message: string,
  },
}
