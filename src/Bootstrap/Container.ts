import * as winston from 'winston'
import { Container } from 'inversify'
import { Env } from './Env'
import TYPES from './Types'
import { Connection, createConnection, LoggerOptions } from 'typeorm'

export class ContainerConfigLoader {
    async load(): Promise<Container> {
        const env: Env = new Env()
        env.load()

        const container = new Container()

        const connection: Connection = await createConnection({
          type: 'mysql',
          replication: {
            master: {
              host: env.get('DB_HOST'),
              port: parseInt(env.get('DB_PORT')),
              username: env.get('DB_USERNAME'),
              password: env.get('DB_PASSWORD'),
              database: env.get('DB_DATABASE'),
            },
            slaves: [
              {
                host: env.get('DB_REPLICA_HOST'),
                port: parseInt(env.get('DB_PORT')),
                username: env.get('DB_USERNAME'),
                password: env.get('DB_PASSWORD'),
                database: env.get('DB_DATABASE'),
              }
            ]
          },
          entities: [
          ],
          migrations: [
            env.get('DB_MIGRATIONS_PATH')
          ],
          migrationsRun: true,
          logging: <LoggerOptions> env.get('DB_DEBUG_LEVEL'),
        })
        container.bind<Connection>(TYPES.DBConnection).toConstantValue(connection)

        const logger = winston.createLogger({
          level: env.get('LOG_LEVEL') || 'info',
          format: winston.format.combine(
              winston.format.splat(),
              winston.format.json(),
          ),
          transports: [
              new winston.transports.Console({ level: env.get('LOG_LEVEL') || 'info' }),
          ],
        })
        container.bind<winston.Logger>(TYPES.Logger).toConstantValue(logger)

        return container
    }
}
