import 'reflect-metadata'

import { Request, Response } from 'express'
import { results } from 'inversify-express-utils'
import { ValetTokenController } from './ValetTokenController'
import { CreateValetToken } from '../Domain/UseCase/CreateValetToken/CreateValetToken'

describe('ValetTokenController', () => {
  let createValetToken: CreateValetToken
  let request: Request
  let response: Response

  const createController = () => new ValetTokenController(
    createValetToken
  )

  beforeEach(() => {
    createValetToken = {} as jest.Mocked<CreateValetToken>
    createValetToken.execute = jest.fn().mockReturnValue({ success: true, valetToken: 'foobar' })

    request = {
      body: {
        operation: 'write',
        resources: ['1-2-3/2-3-4'],
      },
    } as jest.Mocked<Request>

    response = {
      locals: {},
    } as jest.Mocked<Response>

    response.locals.user = { uuid: '1-2-3' }
  })

  it('should create a valet token', async () => {
    const httpResponse = <results.JsonResult> await createController().create(request, response)
    const result = await httpResponse.executeAsync()

    expect(createValetToken.execute).toHaveBeenCalledWith({
      operation: 'write',
      userUuid: '1-2-3',
      resources: [ '1-2-3/2-3-4' ],
    })
    expect(await result.content.readAsStringAsync()).toEqual('{"success":true,"valetToken":"foobar"}')
  })

  it('should not create a valet token if use case fails', async () => {
    createValetToken.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().create(request, response)
    const result = await httpResponse.executeAsync()

    expect(createValetToken.execute).toHaveBeenCalledWith({
      operation: 'write',
      userUuid: '1-2-3',
      resources: [ '1-2-3/2-3-4' ],
    })

    expect(await result.content.readAsStringAsync()).toEqual('{"success":false}')
  })
})
