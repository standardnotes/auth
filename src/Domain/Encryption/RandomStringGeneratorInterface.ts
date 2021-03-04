export interface RandomStringGeneratorInterface {
  generate(length: number): string
  generateUrlSafe(length: number): string
}
