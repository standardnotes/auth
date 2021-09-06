import * as winston from 'winston'
import * as IORedis from 'ioredis'
import * as AWS from 'aws-sdk'
import { Container } from 'inversify'
import {
  DomainEventHandlerInterface,
  DomainEventMessageHandlerInterface,
  DomainEventSubscriberFactoryInterface,
} from '@standardnotes/domain-events'
import { TimerInterface, Timer } from '@standardnotes/time'
import { UAParser } from 'ua-parser-js'

import { Env } from './Env'
import TYPES from './Types'
import { AuthMiddleware } from '../Controller/AuthMiddleware'
import { AuthenticateUser } from '../Domain/UseCase/AuthenticateUser'
import { Connection, createConnection, LoggerOptions } from 'typeorm'
import { User } from '../Domain/User/User'
import { Session } from '../Domain/Session/Session'
import { SessionService } from '../Domain/Session/SessionService'
import { MySQLSessionRepository } from '../Infra/MySQL/MySQLSessionRepository'
import { MySQLUserRepository } from '../Infra/MySQL/MySQLUserRepository'
import { SessionProjector } from '../Projection/SessionProjector'
import { SessionMiddleware } from '../Controller/SessionMiddleware'
import { RefreshSessionToken } from '../Domain/UseCase/RefreshSessionToken'
import { KeyParamsFactory } from '../Domain/User/KeyParamsFactory'
import { SignIn } from '../Domain/UseCase/SignIn'
import { VerifyMFA } from '../Domain/UseCase/VerifyMFA'
import { UserProjector } from '../Projection/UserProjector'
import { AuthResponseFactory20161215 } from '../Domain/Auth/AuthResponseFactory20161215'
import { AuthResponseFactory20190520 } from '../Domain/Auth/AuthResponseFactory20190520'
import { AuthResponseFactory20200115 } from '../Domain/Auth/AuthResponseFactory20200115'
import { AuthResponseFactoryResolver } from '../Domain/Auth/AuthResponseFactoryResolver'
import { ClearLoginAttempts } from '../Domain/UseCase/ClearLoginAttempts'
import { IncreaseLoginAttempts } from '../Domain/UseCase/IncreaseLoginAttempts'
import { LockMiddleware } from '../Controller/LockMiddleware'
import { AuthMiddlewareWithoutResponse } from '../Controller/AuthMiddlewareWithoutResponse'
import { GetUserKeyParams } from '../Domain/UseCase/GetUserKeyParams/GetUserKeyParams'
import { UpdateUser } from '../Domain/UseCase/UpdateUser'
import { RedisEphemeralSessionRepository } from '../Infra/Redis/RedisEphemeralSessionRepository'
import { GetActiveSessionsForUser } from '../Domain/UseCase/GetActiveSessionsForUser'
import { DeletePreviousSessionsForUser } from '../Domain/UseCase/DeletePreviousSessionsForUser'
import { DeleteSessionForUser } from '../Domain/UseCase/DeleteSessionForUser'
import { Register } from '../Domain/UseCase/Register'
import { LockRepository } from '../Infra/Redis/LockRepository'
import { MySQLRevokedSessionRepository } from '../Infra/MySQL/MySQLRevokedSessionRepository'
import { TokenDecoder } from '../Domain/Auth/TokenDecoder'
import { AuthenticationMethodResolver } from '../Domain/Auth/AuthenticationMethodResolver'
import { RevokedSession } from '../Domain/Session/RevokedSession'
import { UserRegisteredEventHandler } from '../Domain/Handler/UserRegisteredEventHandler'
import { ChangePassword } from '../Domain/UseCase/ChangePassword'
import { DomainEventFactory } from '../Domain/Event/DomainEventFactory'
import { AuthenticateRequest } from '../Domain/UseCase/AuthenticateRequest'
import { Role } from '../Domain/Role/Role'
import { Permission } from '../Domain/Permission/Permission'
import { RoleProjector } from '../Projection/RoleProjector'
import { PermissionProjector } from '../Projection/PermissionProjector'
import { MySQLRoleRepository } from '../Infra/MySQL/MySQLRoleRepository'
import { Setting } from '../Domain/Setting/Setting'
import { MySQLSettingRepository } from '../Infra/MySQL/MySQLSettingRepository'
import { CrypterInterface } from '../Domain/Encryption/CrypterInterface'
import { CrypterNode } from '../Domain/Encryption/CrypterNode'
import { SnCryptoNode } from '@standardnotes/sncrypto-node'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { SettingProjector } from '../Projection/SettingProjector'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { UpdateSetting } from '../Domain/UseCase/UpdateSetting/UpdateSetting'
import { GetAuthMethods } from '../Domain/UseCase/GetAuthMethods/GetAuthMethods'
import { AccountDeletionRequestedEventHandler } from '../Domain/Handler/AccountDeletionRequestedEventHandler'
import { SubscriptionPurchasedEventHandler } from '../Domain/Handler/SubscriptionPurchasedEventHandler'
import { SubscriptionRenewedEventHandler } from '../Domain/Handler/SubscriptionRenewedEventHandler'
import { SubscriptionRefundedEventHandler } from '../Domain/Handler/SubscriptionRefundedEventHandler'
import { SubscriptionExpiredEventHandler } from '../Domain/Handler/SubscriptionExpiredEventHandler'
import { DeleteAccount } from '../Domain/UseCase/DeleteAccount/DeleteAccount'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'
import { SettingFactory } from '../Domain/Setting/SettingFactory'
import { SettingService } from '../Domain/Setting/SettingService'
import { WebSocketsConnectionRepositoryInterface } from '../Domain/WebSockets/WebSocketsConnectionRepositoryInterface'
import { RedisWebSocketsConnectionRepository } from '../Infra/Redis/RedisWebSocketsConnectionRepository'
import { AddWebSocketsConnection } from '../Domain/UseCase/AddWebSocketsConnection/AddWebSocketsConnection'
import { RemoveWebSocketsConnection } from '../Domain/UseCase/RemoveWebSocketsConnection/RemoveWebSocketsConnection'
import { ContentDecoderInterface } from '../Domain/Encryption/ContentDecoderInterface'
import { ContentDecoder } from '../Domain/Encryption/ContentDecoder'
import axios, { AxiosInstance } from 'axios'
import { UserSubscription } from '../Domain/User/UserSubscription'
import { MySQLUserSubscriptionRepository } from '../Infra/MySQL/MySQLUserSubscriptionRepository'
import { WebSocketsClientService } from '../Infra/WebSockets/WebSocketsClientService'
import { RoleService } from '../Domain/Role/RoleService'
import { ClientServiceInterface } from '../Domain/Client/ClientServiceInterface'
import { RoleServiceInterface } from '../Domain/Role/RoleServiceInterface'
import { GetUserFeatures } from '../Domain/UseCase/GetUserFeatures/GetUserFeatures'
import { RoleToSubscriptionMapInterface } from '../Domain/Role/RoleToSubscriptionMapInterface'
import { RoleToSubscriptionMap } from '../Domain/Role/RoleToSubscriptionMap'
import { FeatureServiceInterface } from '../Domain/Feature/FeatureServiceInterface'
import { FeatureService } from '../Domain/Feature/FeatureService'
import { SettingServiceInterface } from '../Domain/Setting/SettingServiceInterface'
import { ExtensionKeyGrantedEventHandler } from '../Domain/Handler/ExtensionKeyGrantedEventHandler'
import { RedisDomainEventPublisher, RedisDomainEventSubscriberFactory, RedisEventMessageHandler, SNSDomainEventPublisher, SQSDomainEventSubscriberFactory, SQSEventMessageHandler, SQSNewRelicEventMessageHandler } from '@standardnotes/domain-events-infra'
import { GetUserSubscription } from '../Domain/UseCase/GetUserSubscription/GetUserSubscription'

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
          },
        ],
        removeNodeErrorCount: 10,
      },
      entities: [
        User,
        UserSubscription,
        Session,
        RevokedSession,
        Role,
        Permission,
        Setting,
      ],
      migrations: [
        env.get('DB_MIGRATIONS_PATH'),
      ],
      migrationsRun: true,
      logging: <LoggerOptions> env.get('DB_DEBUG_LEVEL'),
    })
    container.bind<Connection>(TYPES.DBConnection).toConstantValue(connection)

    const redisUrl = env.get('REDIS_URL')
    const isRedisInClusterMode = redisUrl.indexOf(',') > 0
    let redis
    if (isRedisInClusterMode) {
      redis = new IORedis.Cluster(redisUrl.split(','))
    } else {
      redis = new IORedis(redisUrl)
    }

    container.bind(TYPES.Redis).toConstantValue(redis)

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

    if (env.get('SNS_AWS_REGION', true)) {
      container.bind<AWS.SNS>(TYPES.SNS).toConstantValue(new AWS.SNS({
        apiVersion: 'latest',
        region: env.get('SNS_AWS_REGION', true),
      }))
    }

    if (env.get('SQS_AWS_REGION', true)) {
      container.bind<AWS.SQS>(TYPES.SQS).toConstantValue(new AWS.SQS({
        apiVersion: 'latest',
        region: env.get('SQS_AWS_REGION', true),
      }))
    }

    // Repositories
    container.bind<MySQLSessionRepository>(TYPES.SessionRepository).toConstantValue(connection.getCustomRepository(MySQLSessionRepository))
    container.bind<MySQLRevokedSessionRepository>(TYPES.RevokedSessionRepository).toConstantValue(connection.getCustomRepository(MySQLRevokedSessionRepository))
    container.bind<MySQLUserRepository>(TYPES.UserRepository).toConstantValue(connection.getCustomRepository(MySQLUserRepository))
    container.bind<MySQLSettingRepository>(TYPES.SettingRepository).toConstantValue(connection.getCustomRepository(MySQLSettingRepository))
    container.bind<MySQLRoleRepository>(TYPES.RoleRepository).toConstantValue(connection.getCustomRepository(MySQLRoleRepository))
    container.bind<MySQLUserSubscriptionRepository>(TYPES.UserSubscriptionRepository).toConstantValue(connection.getCustomRepository(MySQLUserSubscriptionRepository))
    container.bind<RedisEphemeralSessionRepository>(TYPES.EphemeralSessionRepository).to(RedisEphemeralSessionRepository)
    container.bind<LockRepository>(TYPES.LockRepository).to(LockRepository)
    container.bind<WebSocketsConnectionRepositoryInterface>(TYPES.WebSocketsConnectionRepository).to(RedisWebSocketsConnectionRepository)

    // Middleware
    container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware)
    container.bind<SessionMiddleware>(TYPES.SessionMiddleware).to(SessionMiddleware)
    container.bind<LockMiddleware>(TYPES.LockMiddleware).to(LockMiddleware)
    container.bind<AuthMiddlewareWithoutResponse>(TYPES.AuthMiddlewareWithoutResponse).to(AuthMiddlewareWithoutResponse)

    // Projectors
    container.bind<SessionProjector>(TYPES.SessionProjector).to(SessionProjector)
    container.bind<UserProjector>(TYPES.UserProjector).to(UserProjector)
    container.bind<RoleProjector>(TYPES.RoleProjector).to(RoleProjector)
    container.bind<PermissionProjector>(TYPES.PermissionProjector).to(PermissionProjector)
    container.bind<SettingProjector>(TYPES.SettingProjector).to(SettingProjector)

    // Factories
    container.bind<SettingFactory>(TYPES.SettingFactory).to(SettingFactory)

    // env vars
    container.bind(TYPES.JWT_SECRET).toConstantValue(env.get('JWT_SECRET'))
    container.bind(TYPES.LEGACY_JWT_SECRET).toConstantValue(env.get('LEGACY_JWT_SECRET'))
    container.bind(TYPES.AUTH_JWT_SECRET).toConstantValue(env.get('AUTH_JWT_SECRET'))
    container.bind(TYPES.AUTH_JWT_TTL).toConstantValue(env.get('AUTH_JWT_TTL'))
    container.bind(TYPES.ENCRYPTION_SERVER_KEY).toConstantValue(env.get('ENCRYPTION_SERVER_KEY'))
    container.bind(TYPES.ACCESS_TOKEN_AGE).toConstantValue(env.get('ACCESS_TOKEN_AGE'))
    container.bind(TYPES.REFRESH_TOKEN_AGE).toConstantValue(env.get('REFRESH_TOKEN_AGE'))
    container.bind(TYPES.MAX_LOGIN_ATTEMPTS).toConstantValue(env.get('MAX_LOGIN_ATTEMPTS'))
    container.bind(TYPES.FAILED_LOGIN_LOCKOUT).toConstantValue(env.get('FAILED_LOGIN_LOCKOUT'))
    container.bind(TYPES.PSEUDO_KEY_PARAMS_KEY).toConstantValue(env.get('PSEUDO_KEY_PARAMS_KEY'))
    container.bind(TYPES.EPHEMERAL_SESSION_AGE).toConstantValue(env.get('EPHEMERAL_SESSION_AGE'))
    container.bind(TYPES.REDIS_URL).toConstantValue(env.get('REDIS_URL'))
    container.bind(TYPES.DISABLE_USER_REGISTRATION).toConstantValue(env.get('DISABLE_USER_REGISTRATION') === 'true')
    container.bind(TYPES.SNS_TOPIC_ARN).toConstantValue(env.get('SNS_TOPIC_ARN', true))
    container.bind(TYPES.SNS_AWS_REGION).toConstantValue(env.get('SNS_AWS_REGION', true))
    container.bind(TYPES.SQS_QUEUE_URL).toConstantValue(env.get('SQS_QUEUE_URL', true))
    container.bind(TYPES.USER_SERVER_REGISTRATION_URL).toConstantValue(env.get('USER_SERVER_REGISTRATION_URL', true))
    container.bind(TYPES.USER_SERVER_AUTH_KEY).toConstantValue(env.get('USER_SERVER_AUTH_KEY', true))
    container.bind(TYPES.USER_SERVER_CHANGE_EMAIL_URL).toConstantValue(env.get('USER_SERVER_CHANGE_EMAIL_URL', true))
    container.bind(TYPES.REDIS_EVENTS_CHANNEL).toConstantValue(env.get('REDIS_EVENTS_CHANNEL'))
    container.bind(TYPES.NEW_RELIC_ENABLED).toConstantValue(env.get('NEW_RELIC_ENABLED', true))
    container.bind(TYPES.SYNCING_SERVER_URL).toConstantValue(env.get('SYNCING_SERVER_URL'))
    container.bind(TYPES.WEBSOCKETS_API_URL).toConstantValue(env.get('WEBSOCKETS_API_URL', true))
    container.bind(TYPES.VERSION).toConstantValue(env.get('VERSION'))
    container.bind(TYPES.EXTENSION_SERVER_URL).toConstantValue(env.get('EXTENSION_SERVER_URL', true))

    // use cases
    container.bind<AuthenticateUser>(TYPES.AuthenticateUser).to(AuthenticateUser)
    container.bind<AuthenticateRequest>(TYPES.AuthenticateRequest).to(AuthenticateRequest)
    container.bind<RefreshSessionToken>(TYPES.RefreshSessionToken).to(RefreshSessionToken)
    container.bind<SignIn>(TYPES.SignIn).to(SignIn)
    container.bind<VerifyMFA>(TYPES.VerifyMFA).to(VerifyMFA)
    container.bind<ClearLoginAttempts>(TYPES.ClearLoginAttempts).to(ClearLoginAttempts)
    container.bind<IncreaseLoginAttempts>(TYPES.IncreaseLoginAttempts).to(IncreaseLoginAttempts)
    container.bind<GetUserKeyParams>(TYPES.GetUserKeyParams).to(GetUserKeyParams)
    container.bind<UpdateUser>(TYPES.UpdateUser).to(UpdateUser)
    container.bind<Register>(TYPES.Register).to(Register)
    container.bind<GetActiveSessionsForUser>(TYPES.GetActiveSessionsForUser).to(GetActiveSessionsForUser)
    container.bind<DeletePreviousSessionsForUser>(TYPES.DeletePreviousSessionsForUser).to(DeletePreviousSessionsForUser)
    container.bind<DeleteSessionForUser>(TYPES.DeleteSessionForUser).to(DeleteSessionForUser)
    container.bind<ChangePassword>(TYPES.ChangePassword).to(ChangePassword)
    container.bind<GetSettings>(TYPES.GetSettings).to(GetSettings)
    container.bind<GetSetting>(TYPES.GetSetting).to(GetSetting)
    container.bind<GetUserFeatures>(TYPES.GetUserFeatures).to(GetUserFeatures)
    container.bind<UpdateSetting>(TYPES.UpdateSetting).to(UpdateSetting)
    container.bind<DeleteSetting>(TYPES.DeleteSetting).to(DeleteSetting)
    container.bind<GetAuthMethods>(TYPES.GetAuthMethods).to(GetAuthMethods)
    container.bind<DeleteAccount>(TYPES.DeleteAccount).to(DeleteAccount)
    container.bind<AddWebSocketsConnection>(TYPES.AddWebSocketsConnection).to(AddWebSocketsConnection)
    container.bind<RemoveWebSocketsConnection>(TYPES.RemoveWebSocketsConnection).to(RemoveWebSocketsConnection)
    container.bind<GetUserSubscription>(TYPES.GetUserSubscription).to(GetUserSubscription)

    // Handlers
    container.bind<UserRegisteredEventHandler>(TYPES.UserRegisteredEventHandler).to(UserRegisteredEventHandler)
    container.bind<AccountDeletionRequestedEventHandler>(TYPES.AccountDeletionRequestedEventHandler).to(AccountDeletionRequestedEventHandler)
    container.bind<SubscriptionPurchasedEventHandler>(TYPES.SubscriptionPurchasedEventHandler).to(SubscriptionPurchasedEventHandler)
    container.bind<SubscriptionRenewedEventHandler>(TYPES.SubscriptionRenewedEventHandler).to(SubscriptionRenewedEventHandler)
    container.bind<SubscriptionRefundedEventHandler>(TYPES.SubscriptionRefundedEventHandler).to(SubscriptionRefundedEventHandler)
    container.bind<SubscriptionExpiredEventHandler>(TYPES.SubscriptionExpiredEventHandler).to(SubscriptionExpiredEventHandler)
    container.bind<ExtensionKeyGrantedEventHandler>(TYPES.ExtensionKeyGrantedEventHandler).to(ExtensionKeyGrantedEventHandler)

    // Services
    container.bind<UAParser>(TYPES.DeviceDetector).toConstantValue(new UAParser())
    container.bind<SessionService>(TYPES.SessionService).to(SessionService)
    container.bind<AuthResponseFactory20161215>(TYPES.AuthResponseFactory20161215).to(AuthResponseFactory20161215)
    container.bind<AuthResponseFactory20190520>(TYPES.AuthResponseFactory20190520).to(AuthResponseFactory20190520)
    container.bind<AuthResponseFactory20200115>(TYPES.AuthResponseFactory20200115).to(AuthResponseFactory20200115)
    container.bind<AuthResponseFactoryResolver>(TYPES.AuthResponseFactoryResolver).to(AuthResponseFactoryResolver)
    container.bind<KeyParamsFactory>(TYPES.KeyParamsFactory).to(KeyParamsFactory)
    container.bind<TokenDecoder>(TYPES.TokenDecoder).to(TokenDecoder)
    container.bind<AuthenticationMethodResolver>(TYPES.AuthenticationMethodResolver).to(AuthenticationMethodResolver)
    container.bind<DomainEventFactory>(TYPES.DomainEventFactory).to(DomainEventFactory)
    container.bind<AxiosInstance>(TYPES.HTTPClient).toConstantValue(axios.create())
    container.bind<CrypterInterface>(TYPES.Crypter).to(CrypterNode)
    container.bind<SettingServiceInterface>(TYPES.SettingService).to(SettingService)
    container.bind<SnCryptoNode>(TYPES.SnCryptoNode).toConstantValue(new SnCryptoNode())
    container.bind<TimerInterface>(TYPES.Timer).toConstantValue(new Timer())
    container.bind<ContentDecoderInterface>(TYPES.ContenDecoder).to(ContentDecoder)
    container.bind<ClientServiceInterface>(TYPES.WebSocketsClientService).to(WebSocketsClientService)
    container.bind<RoleServiceInterface>(TYPES.RoleService).to(RoleService)
    container.bind<RoleToSubscriptionMapInterface>(TYPES.RoleToSubscriptionMap).to(RoleToSubscriptionMap)
    container.bind<FeatureServiceInterface>(TYPES.FeatureService).to(FeatureService)

    if (env.get('SNS_TOPIC_ARN', true)) {
      container.bind<SNSDomainEventPublisher>(TYPES.DomainEventPublisher).toConstantValue(
        new SNSDomainEventPublisher(
          container.get(TYPES.SNS),
          container.get(TYPES.SNS_TOPIC_ARN)
        )
      )
    } else {
      container.bind<RedisDomainEventPublisher>(TYPES.DomainEventPublisher).toConstantValue(
        new RedisDomainEventPublisher(
          container.get(TYPES.Redis),
          container.get(TYPES.REDIS_EVENTS_CHANNEL)
        )
      )
    }

    const eventHandlers: Map<string, DomainEventHandlerInterface> = new Map([
      ['USER_REGISTERED', container.get(TYPES.UserRegisteredEventHandler)],
      ['ACCOUNT_DELETION_REQUESTED', container.get(TYPES.AccountDeletionRequestedEventHandler)],
      ['SUBSCRIPTION_PURCHASED', container.get(TYPES.SubscriptionPurchasedEventHandler)],
      ['SUBSCRIPTION_RENEWED', container.get(TYPES.SubscriptionRenewedEventHandler)],
      ['SUBSCRIPTION_REFUNDED', container.get(TYPES.SubscriptionRefundedEventHandler)],
      ['SUBSCRIPTION_EXPIRED', container.get(TYPES.SubscriptionExpiredEventHandler)],
      ['EXTENSION_KEY_GRANTED', container.get(TYPES.ExtensionKeyGrantedEventHandler)],
    ])

    if (env.get('SQS_QUEUE_URL', true)) {
      container.bind<DomainEventMessageHandlerInterface>(TYPES.DomainEventMessageHandler).toConstantValue(
        env.get('NEW_RELIC_ENABLED', true) === 'true' ?
          new SQSNewRelicEventMessageHandler(eventHandlers, container.get(TYPES.Logger)) :
          new SQSEventMessageHandler(eventHandlers, container.get(TYPES.Logger))
      )
      container.bind<DomainEventSubscriberFactoryInterface>(TYPES.DomainEventSubscriberFactory).toConstantValue(
        new SQSDomainEventSubscriberFactory(
          container.get(TYPES.SQS),
          container.get(TYPES.SQS_QUEUE_URL),
          container.get(TYPES.DomainEventMessageHandler)
        )
      )
    } else {
      container.bind<DomainEventMessageHandlerInterface>(TYPES.DomainEventMessageHandler).toConstantValue(
        new RedisEventMessageHandler(eventHandlers, container.get(TYPES.Logger))
      )
      container.bind<DomainEventSubscriberFactoryInterface>(TYPES.DomainEventSubscriberFactory).toConstantValue(
        new RedisDomainEventSubscriberFactory(
          container.get(TYPES.Redis),
          container.get(TYPES.DomainEventMessageHandler),
          container.get(TYPES.REDIS_EVENTS_CHANNEL)
        )
      )
    }

    return container
  }
}
