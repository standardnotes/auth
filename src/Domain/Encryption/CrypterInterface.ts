export interface CrypterInterface {
  encrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string>
  decrypt(encryptionVersion: number, data: string, masterKey: string): Promise<string>
}
