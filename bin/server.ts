import 'reflect-metadata'

import 'newrelic'

import '../src/Controller/HealthCheckController'
import '../src/Controller/SessionController'
import '../src/Controller/SessionsController'
import '../src/Controller/AuthController'
import '../src/Controller/UsersController'
import '../src/Controller/WebSocketsController'

import * as cors from 'cors'
import { urlencoded, json } from 'express'
import * as prettyjson from 'prettyjson'
import * as winston from 'winston'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'

import { InversifyExpressServer, getRouteInfo } from 'inversify-express-utils'
import { ContainerConfigLoader } from '../src/Bootstrap/Container'
import TYPES from '../src/Bootstrap/Types'
import { Env } from '../src/Bootstrap/Env'

const container = new ContainerConfigLoader
void container.load().then(container => {
  dayjs.extend(utc)

  const server = new InversifyExpressServer(container)

  server.setConfig((app) => {
    app.use(json())
    app.use(urlencoded({ extended: true }))
    app.use(cors())
  })

  const serverInstance = server.build()

  const routeInfo = getRouteInfo(container)

  console.log(prettyjson.render({ routes: routeInfo }))

  const env: Env = new Env()
  env.load()

  serverInstance.listen(env.get('PORT'))

  const logger: winston.Logger = container.get(TYPES.Logger)

  logger.info(`Server started on port ${process.env.PORT}`)
})
