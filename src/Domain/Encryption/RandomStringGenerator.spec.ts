import 'reflect-metadata'

import { RandomStringGenerator } from './RandomStringGenerator'

describe('RandomStringGenerator', () => {
  const generator = () => new RandomStringGenerator()

  it('should generate a random string of a given length', () => {
    expect(generator().generate(32)).toHaveLength(32)
  })

  it('should generate a url safe random string', () => {
    const generator = new RandomStringGenerator()
    jest.spyOn(generator, 'generate')
    generator.generate = jest.fn().mockReturnValue('qwSADew+we/as\\deewr~qwe.-wewr+rew')

    expect(generator.generateUrlSafe(32)).toEqual('qwSADew_we_as_deewr~qwe.-wewr_rew')
  })
})
