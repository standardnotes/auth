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
import { AnalyticsStoreInterface, PeriodKeyGenerator, RedisAnalyticsStore } from '@standardnotes/analytics'

import { Env } from './Env'
import TYPES from './Types'
import { AuthMiddleware } from '../Controller/AuthMiddleware'
import { AuthenticateUser } from '../Domain/UseCase/AuthenticateUser'
import { Repository } from 'typeorm'
import { AppDataSource } from './DataSource'
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
import { AuthenticationMethodResolver } from '../Domain/Auth/AuthenticationMethodResolver'
import { RevokedSession } from '../Domain/Session/RevokedSession'
import { UserRegisteredEventHandler } from '../Domain/Handler/UserRegisteredEventHandler'
import { DomainEventFactory } from '../Domain/Event/DomainEventFactory'
import { AuthenticateRequest } from '../Domain/UseCase/AuthenticateRequest'
import { Role } from '../Domain/Role/Role'
import { RoleProjector } from '../Projection/RoleProjector'
import { PermissionProjector } from '../Projection/PermissionProjector'
import { MySQLRoleRepository } from '../Infra/MySQL/MySQLRoleRepository'
import { Setting } from '../Domain/Setting/Setting'
import { MySQLSettingRepository } from '../Infra/MySQL/MySQLSettingRepository'
import { CrypterInterface } from '../Domain/Encryption/CrypterInterface'
import { CrypterNode } from '../Domain/Encryption/CrypterNode'
import { CryptoNode } from '@standardnotes/sncrypto-node'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { SettingProjector } from '../Projection/SettingProjector'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { UpdateSetting } from '../Domain/UseCase/UpdateSetting/UpdateSetting'
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
import axios, { AxiosInstance } from 'axios'
import { UserSubscription } from '../Domain/Subscription/UserSubscription'
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
import {
  RedisDomainEventPublisher,
  RedisDomainEventSubscriberFactory,
  RedisEventMessageHandler,
  SNSDomainEventPublisher,
  SQSDomainEventSubscriberFactory,
  SQSEventMessageHandler,
  SQSNewRelicEventMessageHandler,
} from '@standardnotes/domain-events-infra'
import { GetUserSubscription } from '../Domain/UseCase/GetUserSubscription/GetUserSubscription'
import { ChangeCredentials } from '../Domain/UseCase/ChangeCredentials/ChangeCredentials'
import { SubscriptionReassignedEventHandler } from '../Domain/Handler/SubscriptionReassignedEventHandler'
import { UserSubscriptionRepositoryInterface } from '../Domain/Subscription/UserSubscriptionRepositoryInterface'
import { CreateSubscriptionToken } from '../Domain/UseCase/CreateSubscriptionToken/CreateSubscriptionToken'
import { ApiGatewayAuthMiddleware } from '../Controller/ApiGatewayAuthMiddleware'
import { SubscriptionTokenRepositoryInterface } from '../Domain/Subscription/SubscriptionTokenRepositoryInterface'
import { RedisSubscriptionTokenRepository } from '../Infra/Redis/RedisSubscriptionTokenRepository'
import { AuthenticateSubscriptionToken } from '../Domain/UseCase/AuthenticateSubscriptionToken/AuthenticateSubscriptionToken'
import { OfflineSetting } from '../Domain/Setting/OfflineSetting'
import { OfflineSettingServiceInterface } from '../Domain/Setting/OfflineSettingServiceInterface'
import { OfflineSettingService } from '../Domain/Setting/OfflineSettingService'
import { OfflineSettingRepositoryInterface } from '../Domain/Setting/OfflineSettingRepositoryInterface'
import { SettingRepositoryInterface } from '../Domain/Setting/SettingRepositoryInterface'
import { MySQLOfflineSettingRepository } from '../Infra/MySQL/MySQLOfflineSettingRepository'
import { OfflineUserSubscription } from '../Domain/Subscription/OfflineUserSubscription'
import { OfflineUserSubscriptionRepositoryInterface } from '../Domain/Subscription/OfflineUserSubscriptionRepositoryInterface'
import { MySQLOfflineUserSubscriptionRepository } from '../Infra/MySQL/MySQLOfflineUserSubscriptionRepository'
import { OfflineUserAuthMiddleware } from '../Controller/OfflineUserAuthMiddleware'
import { OfflineSubscriptionTokenRepositoryInterface } from '../Domain/Auth/OfflineSubscriptionTokenRepositoryInterface'
import { RedisOfflineSubscriptionTokenRepository } from '../Infra/Redis/RedisOfflineSubscriptionTokenRepository'
import { CreateOfflineSubscriptionToken } from '../Domain/UseCase/CreateOfflineSubscriptionToken/CreateOfflineSubscriptionToken'
import { AuthenticateOfflineSubscriptionToken } from '../Domain/UseCase/AuthenticateOfflineSubscriptionToken/AuthenticateOfflineSubscriptionToken'
import { SubscriptionCancelledEventHandler } from '../Domain/Handler/SubscriptionCancelledEventHandler'
import { ContentDecoder, ContentDecoderInterface, ProtocolVersion } from '@standardnotes/common'
import { GetUserOfflineSubscription } from '../Domain/UseCase/GetUserOfflineSubscription/GetUserOfflineSubscription'
import { ApiGatewayOfflineAuthMiddleware } from '../Controller/ApiGatewayOfflineAuthMiddleware'
import { UserEmailChangedEventHandler } from '../Domain/Handler/UserEmailChangedEventHandler'
import { SettingsAssociationServiceInterface } from '../Domain/Setting/SettingsAssociationServiceInterface'
import { SettingsAssociationService } from '../Domain/Setting/SettingsAssociationService'
import { MuteFailedBackupsEmails } from '../Domain/UseCase/MuteFailedBackupsEmails/MuteFailedBackupsEmails'
import { SubscriptionSyncRequestedEventHandler } from '../Domain/Handler/SubscriptionSyncRequestedEventHandler'
import {
  CrossServiceTokenData,
  DeterministicSelector,
  OfflineUserTokenData,
  SelectorInterface,
  SessionTokenData,
  TokenDecoder,
  TokenDecoderInterface,
  TokenEncoder,
  TokenEncoderInterface,
  ValetTokenData,
} from '@standardnotes/auth'
import { FileUploadedEventHandler } from '../Domain/Handler/FileUploadedEventHandler'
import { CreateValetToken } from '../Domain/UseCase/CreateValetToken/CreateValetToken'
import { CreateListedAccount } from '../Domain/UseCase/CreateListedAccount/CreateListedAccount'
import { ListedAccountCreatedEventHandler } from '../Domain/Handler/ListedAccountCreatedEventHandler'
import { ListedAccountDeletedEventHandler } from '../Domain/Handler/ListedAccountDeletedEventHandler'
import { MuteSignInEmails } from '../Domain/UseCase/MuteSignInEmails/MuteSignInEmails'
import { FileRemovedEventHandler } from '../Domain/Handler/FileRemovedEventHandler'
import { UserDisabledSessionUserAgentLoggingEventHandler } from '../Domain/Handler/UserDisabledSessionUserAgentLoggingEventHandler'
import { SettingInterpreterInterface } from '../Domain/Setting/SettingInterpreterInterface'
import { SettingInterpreter } from '../Domain/Setting/SettingInterpreter'
import { SettingDecrypterInterface } from '../Domain/Setting/SettingDecrypterInterface'
import { SettingDecrypter } from '../Domain/Setting/SettingDecrypter'
import { SharedSubscriptionInvitationRepositoryInterface } from '../Domain/SharedSubscription/SharedSubscriptionInvitationRepositoryInterface'
import { MySQLSharedSubscriptionInvitationRepository } from '../Infra/MySQL/MySQLSharedSubscriptionInvitationRepository'
import { InviteToSharedSubscription } from '../Domain/UseCase/InviteToSharedSubscription/InviteToSharedSubscription'
import { SharedSubscriptionInvitation } from '../Domain/SharedSubscription/SharedSubscriptionInvitation'
import { AcceptSharedSubscriptionInvitation } from '../Domain/UseCase/AcceptSharedSubscriptionInvitation/AcceptSharedSubscriptionInvitation'
import { DeclineSharedSubscriptionInvitation } from '../Domain/UseCase/DeclineSharedSubscriptionInvitation/DeclineSharedSubscriptionInvitation'
import { CancelSharedSubscriptionInvitation } from '../Domain/UseCase/CancelSharedSubscriptionInvitation/CancelSharedSubscriptionInvitation'
import { SharedSubscriptionInvitationCreatedEventHandler } from '../Domain/Handler/SharedSubscriptionInvitationCreatedEventHandler'
import { SubscriptionSetting } from '../Domain/Setting/SubscriptionSetting'
import { SubscriptionSettingServiceInterface } from '../Domain/Setting/SubscriptionSettingServiceInterface'
import { SubscriptionSettingService } from '../Domain/Setting/SubscriptionSettingService'
import { SubscriptionSettingRepositoryInterface } from '../Domain/Setting/SubscriptionSettingRepositoryInterface'
import { MySQLSubscriptionSettingRepository } from '../Infra/MySQL/MySQLSubscriptionSettingRepository'
import { SettingFactoryInterface } from '../Domain/Setting/SettingFactoryInterface'
import { ListSharedSubscriptionInvitations } from '../Domain/UseCase/ListSharedSubscriptionInvitations/ListSharedSubscriptionInvitations'
import { UserSubscriptionServiceInterface } from '../Domain/Subscription/UserSubscriptionServiceInterface'
import { UserSubscriptionService } from '../Domain/Subscription/UserSubscriptionService'
import { SubscriptionSettingProjector } from '../Projection/SubscriptionSettingProjector'
import { GetSubscriptionSetting } from '../Domain/UseCase/GetSubscriptionSetting/GetSubscriptionSetting'
import { SubscriptionSettingsAssociationService } from '../Domain/Setting/SubscriptionSettingsAssociationService'
import { SubscriptionSettingsAssociationServiceInterface } from '../Domain/Setting/SubscriptionSettingsAssociationServiceInterface'
import { PKCERepositoryInterface } from '../Domain/User/PKCERepositoryInterface'
import { RedisPKCERepository } from '../Infra/Redis/RedisPKCERepository'
import { RoleRepositoryInterface } from '../Domain/Role/RoleRepositoryInterface'
import { RevokedSessionRepositoryInterface } from '../Domain/Session/RevokedSessionRepositoryInterface'
import { SessionRepositoryInterface } from '../Domain/Session/SessionRepositoryInterface'
import { UserRepositoryInterface } from '../Domain/User/UserRepositoryInterface'
import { AnalyticsEntity } from '../Domain/Analytics/AnalyticsEntity'
import { AnalyticsEntityRepositoryInterface } from '../Domain/Analytics/AnalyticsEntityRepositoryInterface'
import { MySQLAnalyticsEntityRepository } from '../Infra/MySQL/MySQLAnalyticsEntityRepository'
import { GetUserAnalyticsId } from '../Domain/UseCase/GetUserAnalyticsId/GetUserAnalyticsId'
import { AuthController } from '../Controller/AuthController'
import { VerifyPredicate } from '../Domain/UseCase/VerifyPredicate/VerifyPredicate'
import { PredicateVerificationRequestedEventHandler } from '../Domain/Handler/PredicateVerificationRequestedEventHandler'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const newrelicWinstonEnricher = require('@newrelic/winston-enricher')

export class ContainerConfigLoader {
  async load(): Promise<Container> {
    const env: Env = new Env()
    env.load()

    const container = new Container()

    await AppDataSource.initialize()

    const redisUrl = env.get('REDIS_URL')
    const isRedisInClusterMode = redisUrl.indexOf(',') > 0
    let redis
    if (isRedisInClusterMode) {
      redis = new IORedis.Cluster(redisUrl.split(','))
    } else {
      redis = new IORedis(redisUrl)
    }

    container.bind(TYPES.Redis).toConstantValue(redis)

    const winstonFormatters = [winston.format.splat(), winston.format.json()]
    if (env.get('NEW_RELIC_ENABLED', true) === 'true') {
      winstonFormatters.push(newrelicWinstonEnricher())
    }

    const logger = winston.createLogger({
      level: env.get('LOG_LEVEL') || 'info',
      format: winston.format.combine(...winstonFormatters),
      transports: [new winston.transports.Console({ level: env.get('LOG_LEVEL') || 'info' })],
    })
    container.bind<winston.Logger>(TYPES.Logger).toConstantValue(logger)

    if (env.get('SNS_AWS_REGION', true)) {
      container.bind<AWS.SNS>(TYPES.SNS).toConstantValue(
        new AWS.SNS({
          apiVersion: 'latest',
          region: env.get('SNS_AWS_REGION', true),
        }),
      )
    }

    if (env.get('SQS_QUEUE_URL', true)) {
      const sqsConfig: AWS.SQS.Types.ClientConfiguration = {
        apiVersion: 'latest',
        region: env.get('SQS_AWS_REGION', true),
      }
      if (env.get('SQS_ACCESS_KEY_ID', true) && env.get('SQS_SECRET_ACCESS_KEY', true)) {
        sqsConfig.credentials = {
          accessKeyId: env.get('SQS_ACCESS_KEY_ID', true),
          secretAccessKey: env.get('SQS_SECRET_ACCESS_KEY', true),
        }
      }
      container.bind<AWS.SQS>(TYPES.SQS).toConstantValue(new AWS.SQS(sqsConfig))
    }

    // Controller
    container.bind<AuthController>(TYPES.AuthController).to(AuthController)

    // Repositories
    container.bind<SessionRepositoryInterface>(TYPES.SessionRepository).to(MySQLSessionRepository)
    container.bind<RevokedSessionRepositoryInterface>(TYPES.RevokedSessionRepository).to(MySQLRevokedSessionRepository)
    container.bind<UserRepositoryInterface>(TYPES.UserRepository).to(MySQLUserRepository)
    container.bind<SettingRepositoryInterface>(TYPES.SettingRepository).to(MySQLSettingRepository)
    container
      .bind<SubscriptionSettingRepositoryInterface>(TYPES.SubscriptionSettingRepository)
      .to(MySQLSubscriptionSettingRepository)
    container.bind<OfflineSettingRepositoryInterface>(TYPES.OfflineSettingRepository).to(MySQLOfflineSettingRepository)
    container.bind<RoleRepositoryInterface>(TYPES.RoleRepository).to(MySQLRoleRepository)
    container
      .bind<UserSubscriptionRepositoryInterface>(TYPES.UserSubscriptionRepository)
      .to(MySQLUserSubscriptionRepository)
    container
      .bind<OfflineUserSubscriptionRepositoryInterface>(TYPES.OfflineUserSubscriptionRepository)
      .to(MySQLOfflineUserSubscriptionRepository)
    container
      .bind<RedisEphemeralSessionRepository>(TYPES.EphemeralSessionRepository)
      .to(RedisEphemeralSessionRepository)
    container.bind<LockRepository>(TYPES.LockRepository).to(LockRepository)
    container
      .bind<WebSocketsConnectionRepositoryInterface>(TYPES.WebSocketsConnectionRepository)
      .to(RedisWebSocketsConnectionRepository)
    container
      .bind<SubscriptionTokenRepositoryInterface>(TYPES.SubscriptionTokenRepository)
      .to(RedisSubscriptionTokenRepository)
    container
      .bind<OfflineSubscriptionTokenRepositoryInterface>(TYPES.OfflineSubscriptionTokenRepository)
      .to(RedisOfflineSubscriptionTokenRepository)
    container
      .bind<SharedSubscriptionInvitationRepositoryInterface>(TYPES.SharedSubscriptionInvitationRepository)
      .to(MySQLSharedSubscriptionInvitationRepository)
    container.bind<PKCERepositoryInterface>(TYPES.PKCERepository).to(RedisPKCERepository)
    container
      .bind<AnalyticsEntityRepositoryInterface>(TYPES.AnalyticsEntityRepository)
      .to(MySQLAnalyticsEntityRepository)

    // ORM
    container
      .bind<Repository<OfflineSetting>>(TYPES.ORMOfflineSettingRepository)
      .toConstantValue(AppDataSource.getRepository(OfflineSetting))
    container
      .bind<Repository<OfflineUserSubscription>>(TYPES.ORMOfflineUserSubscriptionRepository)
      .toConstantValue(AppDataSource.getRepository(OfflineUserSubscription))
    container
      .bind<Repository<RevokedSession>>(TYPES.ORMRevokedSessionRepository)
      .toConstantValue(AppDataSource.getRepository(RevokedSession))
    container.bind<Repository<Role>>(TYPES.ORMRoleRepository).toConstantValue(AppDataSource.getRepository(Role))
    container
      .bind<Repository<Session>>(TYPES.ORMSessionRepository)
      .toConstantValue(AppDataSource.getRepository(Session))
    container
      .bind<Repository<Setting>>(TYPES.ORMSettingRepository)
      .toConstantValue(AppDataSource.getRepository(Setting))
    container
      .bind<Repository<SharedSubscriptionInvitation>>(TYPES.ORMSharedSubscriptionInvitationRepository)
      .toConstantValue(AppDataSource.getRepository(SharedSubscriptionInvitation))
    container
      .bind<Repository<SubscriptionSetting>>(TYPES.ORMSubscriptionSettingRepository)
      .toConstantValue(AppDataSource.getRepository(SubscriptionSetting))
    container.bind<Repository<User>>(TYPES.ORMUserRepository).toConstantValue(AppDataSource.getRepository(User))
    container
      .bind<Repository<UserSubscription>>(TYPES.ORMUserSubscriptionRepository)
      .toConstantValue(AppDataSource.getRepository(UserSubscription))
    container
      .bind<Repository<AnalyticsEntity>>(TYPES.ORMAnalyticsEntityRepository)
      .toConstantValue(AppDataSource.getRepository(AnalyticsEntity))

    // Middleware
    container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware)
    container.bind<SessionMiddleware>(TYPES.SessionMiddleware).to(SessionMiddleware)
    container.bind<LockMiddleware>(TYPES.LockMiddleware).to(LockMiddleware)
    container.bind<AuthMiddlewareWithoutResponse>(TYPES.AuthMiddlewareWithoutResponse).to(AuthMiddlewareWithoutResponse)
    container.bind<ApiGatewayAuthMiddleware>(TYPES.ApiGatewayAuthMiddleware).to(ApiGatewayAuthMiddleware)
    container
      .bind<ApiGatewayOfflineAuthMiddleware>(TYPES.ApiGatewayOfflineAuthMiddleware)
      .to(ApiGatewayOfflineAuthMiddleware)
    container.bind<OfflineUserAuthMiddleware>(TYPES.OfflineUserAuthMiddleware).to(OfflineUserAuthMiddleware)

    // Projectors
    container.bind<SessionProjector>(TYPES.SessionProjector).to(SessionProjector)
    container.bind<UserProjector>(TYPES.UserProjector).to(UserProjector)
    container.bind<RoleProjector>(TYPES.RoleProjector).to(RoleProjector)
    container.bind<PermissionProjector>(TYPES.PermissionProjector).to(PermissionProjector)
    container.bind<SettingProjector>(TYPES.SettingProjector).to(SettingProjector)
    container.bind<SubscriptionSettingProjector>(TYPES.SubscriptionSettingProjector).to(SubscriptionSettingProjector)

    // Factories
    container.bind<SettingFactoryInterface>(TYPES.SettingFactory).to(SettingFactory)

    // env vars
    container.bind(TYPES.JWT_SECRET).toConstantValue(env.get('JWT_SECRET'))
    container.bind(TYPES.LEGACY_JWT_SECRET).toConstantValue(env.get('LEGACY_JWT_SECRET'))
    container.bind(TYPES.AUTH_JWT_SECRET).toConstantValue(env.get('AUTH_JWT_SECRET'))
    container.bind(TYPES.AUTH_JWT_TTL).toConstantValue(+env.get('AUTH_JWT_TTL'))
    container.bind(TYPES.VALET_TOKEN_SECRET).toConstantValue(env.get('VALET_TOKEN_SECRET', true))
    container.bind(TYPES.VALET_TOKEN_TTL).toConstantValue(+env.get('VALET_TOKEN_TTL', true))
    container.bind(TYPES.ENCRYPTION_SERVER_KEY).toConstantValue(env.get('ENCRYPTION_SERVER_KEY'))
    container.bind(TYPES.ACCESS_TOKEN_AGE).toConstantValue(env.get('ACCESS_TOKEN_AGE'))
    container.bind(TYPES.REFRESH_TOKEN_AGE).toConstantValue(env.get('REFRESH_TOKEN_AGE'))
    container.bind(TYPES.MAX_LOGIN_ATTEMPTS).toConstantValue(env.get('MAX_LOGIN_ATTEMPTS'))
    container.bind(TYPES.FAILED_LOGIN_LOCKOUT).toConstantValue(env.get('FAILED_LOGIN_LOCKOUT'))
    container.bind(TYPES.PSEUDO_KEY_PARAMS_KEY).toConstantValue(env.get('PSEUDO_KEY_PARAMS_KEY'))
    container.bind(TYPES.EPHEMERAL_SESSION_AGE).toConstantValue(env.get('EPHEMERAL_SESSION_AGE'))
    container.bind(TYPES.REDIS_URL).toConstantValue(env.get('REDIS_URL'))
    container.bind(TYPES.DISABLE_USER_REGISTRATION).toConstantValue(env.get('DISABLE_USER_REGISTRATION') === 'true')
    container.bind(TYPES.ANALYTICS_ENABLED).toConstantValue(env.get('ANALYTICS_ENABLED', true) === 'true')
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
    container.bind(TYPES.PAYMENTS_SERVER_URL).toConstantValue(env.get('PAYMENTS_SERVER_URL', true))

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
    container.bind<ChangeCredentials>(TYPES.ChangeCredentials).to(ChangeCredentials)
    container.bind<GetSettings>(TYPES.GetSettings).to(GetSettings)
    container.bind<GetSetting>(TYPES.GetSetting).to(GetSetting)
    container.bind<GetUserFeatures>(TYPES.GetUserFeatures).to(GetUserFeatures)
    container.bind<UpdateSetting>(TYPES.UpdateSetting).to(UpdateSetting)
    container.bind<DeleteSetting>(TYPES.DeleteSetting).to(DeleteSetting)
    container.bind<DeleteAccount>(TYPES.DeleteAccount).to(DeleteAccount)
    container.bind<AddWebSocketsConnection>(TYPES.AddWebSocketsConnection).to(AddWebSocketsConnection)
    container.bind<RemoveWebSocketsConnection>(TYPES.RemoveWebSocketsConnection).to(RemoveWebSocketsConnection)
    container.bind<GetUserSubscription>(TYPES.GetUserSubscription).to(GetUserSubscription)
    container.bind<GetUserOfflineSubscription>(TYPES.GetUserOfflineSubscription).to(GetUserOfflineSubscription)
    container.bind<CreateSubscriptionToken>(TYPES.CreateSubscriptionToken).to(CreateSubscriptionToken)
    container.bind<AuthenticateSubscriptionToken>(TYPES.AuthenticateSubscriptionToken).to(AuthenticateSubscriptionToken)
    container
      .bind<AuthenticateOfflineSubscriptionToken>(TYPES.AuthenticateOfflineSubscriptionToken)
      .to(AuthenticateOfflineSubscriptionToken)
    container
      .bind<CreateOfflineSubscriptionToken>(TYPES.CreateOfflineSubscriptionToken)
      .to(CreateOfflineSubscriptionToken)
    container.bind<MuteFailedBackupsEmails>(TYPES.MuteFailedBackupsEmails).to(MuteFailedBackupsEmails)
    container.bind<MuteSignInEmails>(TYPES.MuteSignInEmails).to(MuteSignInEmails)
    container.bind<CreateValetToken>(TYPES.CreateValetToken).to(CreateValetToken)
    container.bind<CreateListedAccount>(TYPES.CreateListedAccount).to(CreateListedAccount)
    container.bind<InviteToSharedSubscription>(TYPES.InviteToSharedSubscription).to(InviteToSharedSubscription)
    container
      .bind<AcceptSharedSubscriptionInvitation>(TYPES.AcceptSharedSubscriptionInvitation)
      .to(AcceptSharedSubscriptionInvitation)
    container
      .bind<DeclineSharedSubscriptionInvitation>(TYPES.DeclineSharedSubscriptionInvitation)
      .to(DeclineSharedSubscriptionInvitation)
    container
      .bind<CancelSharedSubscriptionInvitation>(TYPES.CancelSharedSubscriptionInvitation)
      .to(CancelSharedSubscriptionInvitation)
    container
      .bind<ListSharedSubscriptionInvitations>(TYPES.ListSharedSubscriptionInvitations)
      .to(ListSharedSubscriptionInvitations)
    container.bind<GetSubscriptionSetting>(TYPES.GetSubscriptionSetting).to(GetSubscriptionSetting)
    container.bind<GetUserAnalyticsId>(TYPES.GetUserAnalyticsId).to(GetUserAnalyticsId)
    container.bind<VerifyPredicate>(TYPES.VerifyPredicate).to(VerifyPredicate)

    // Handlers
    container.bind<UserRegisteredEventHandler>(TYPES.UserRegisteredEventHandler).to(UserRegisteredEventHandler)
    container
      .bind<AccountDeletionRequestedEventHandler>(TYPES.AccountDeletionRequestedEventHandler)
      .to(AccountDeletionRequestedEventHandler)
    container
      .bind<SubscriptionPurchasedEventHandler>(TYPES.SubscriptionPurchasedEventHandler)
      .to(SubscriptionPurchasedEventHandler)
    container
      .bind<SubscriptionCancelledEventHandler>(TYPES.SubscriptionCancelledEventHandler)
      .to(SubscriptionCancelledEventHandler)
    container
      .bind<SubscriptionRenewedEventHandler>(TYPES.SubscriptionRenewedEventHandler)
      .to(SubscriptionRenewedEventHandler)
    container
      .bind<SubscriptionRefundedEventHandler>(TYPES.SubscriptionRefundedEventHandler)
      .to(SubscriptionRefundedEventHandler)
    container
      .bind<SubscriptionExpiredEventHandler>(TYPES.SubscriptionExpiredEventHandler)
      .to(SubscriptionExpiredEventHandler)
    container
      .bind<SubscriptionSyncRequestedEventHandler>(TYPES.SubscriptionSyncRequestedEventHandler)
      .to(SubscriptionSyncRequestedEventHandler)
    container
      .bind<ExtensionKeyGrantedEventHandler>(TYPES.ExtensionKeyGrantedEventHandler)
      .to(ExtensionKeyGrantedEventHandler)
    container
      .bind<SubscriptionReassignedEventHandler>(TYPES.SubscriptionReassignedEventHandler)
      .to(SubscriptionReassignedEventHandler)
    container.bind<UserEmailChangedEventHandler>(TYPES.UserEmailChangedEventHandler).to(UserEmailChangedEventHandler)
    container.bind<FileUploadedEventHandler>(TYPES.FileUploadedEventHandler).to(FileUploadedEventHandler)
    container.bind<FileRemovedEventHandler>(TYPES.FileRemovedEventHandler).to(FileRemovedEventHandler)
    container
      .bind<ListedAccountCreatedEventHandler>(TYPES.ListedAccountCreatedEventHandler)
      .to(ListedAccountCreatedEventHandler)
    container
      .bind<ListedAccountDeletedEventHandler>(TYPES.ListedAccountDeletedEventHandler)
      .to(ListedAccountDeletedEventHandler)
    container
      .bind<UserDisabledSessionUserAgentLoggingEventHandler>(TYPES.UserDisabledSessionUserAgentLoggingEventHandler)
      .to(UserDisabledSessionUserAgentLoggingEventHandler)
    container
      .bind<SharedSubscriptionInvitationCreatedEventHandler>(TYPES.SharedSubscriptionInvitationCreatedEventHandler)
      .to(SharedSubscriptionInvitationCreatedEventHandler)
    container
      .bind<PredicateVerificationRequestedEventHandler>(TYPES.PredicateVerificationRequestedEventHandler)
      .to(PredicateVerificationRequestedEventHandler)

    // Services
    container.bind<UAParser>(TYPES.DeviceDetector).toConstantValue(new UAParser())
    container.bind<SessionService>(TYPES.SessionService).to(SessionService)
    container.bind<AuthResponseFactory20161215>(TYPES.AuthResponseFactory20161215).to(AuthResponseFactory20161215)
    container.bind<AuthResponseFactory20190520>(TYPES.AuthResponseFactory20190520).to(AuthResponseFactory20190520)
    container.bind<AuthResponseFactory20200115>(TYPES.AuthResponseFactory20200115).to(AuthResponseFactory20200115)
    container.bind<AuthResponseFactoryResolver>(TYPES.AuthResponseFactoryResolver).to(AuthResponseFactoryResolver)
    container.bind<KeyParamsFactory>(TYPES.KeyParamsFactory).to(KeyParamsFactory)
    container
      .bind<TokenDecoderInterface<SessionTokenData>>(TYPES.SessionTokenDecoder)
      .toConstantValue(new TokenDecoder<SessionTokenData>(container.get(TYPES.JWT_SECRET)))
    container
      .bind<TokenDecoderInterface<SessionTokenData>>(TYPES.FallbackSessionTokenDecoder)
      .toConstantValue(new TokenDecoder<SessionTokenData>(container.get(TYPES.LEGACY_JWT_SECRET)))
    container
      .bind<TokenDecoderInterface<CrossServiceTokenData>>(TYPES.CrossServiceTokenDecoder)
      .toConstantValue(new TokenDecoder<CrossServiceTokenData>(container.get(TYPES.AUTH_JWT_SECRET)))
    container
      .bind<TokenDecoderInterface<OfflineUserTokenData>>(TYPES.OfflineUserTokenDecoder)
      .toConstantValue(new TokenDecoder<OfflineUserTokenData>(container.get(TYPES.AUTH_JWT_SECRET)))
    container
      .bind<TokenEncoderInterface<OfflineUserTokenData>>(TYPES.OfflineUserTokenEncoder)
      .toConstantValue(new TokenEncoder<OfflineUserTokenData>(container.get(TYPES.AUTH_JWT_SECRET)))
    container
      .bind<TokenEncoderInterface<SessionTokenData>>(TYPES.SessionTokenEncoder)
      .toConstantValue(new TokenEncoder<SessionTokenData>(container.get(TYPES.JWT_SECRET)))
    container
      .bind<TokenEncoderInterface<CrossServiceTokenData>>(TYPES.CrossServiceTokenEncoder)
      .toConstantValue(new TokenEncoder<CrossServiceTokenData>(container.get(TYPES.AUTH_JWT_SECRET)))
    container
      .bind<TokenEncoderInterface<ValetTokenData>>(TYPES.ValetTokenEncoder)
      .toConstantValue(new TokenEncoder<ValetTokenData>(container.get(TYPES.VALET_TOKEN_SECRET)))
    container.bind<AuthenticationMethodResolver>(TYPES.AuthenticationMethodResolver).to(AuthenticationMethodResolver)
    container.bind<DomainEventFactory>(TYPES.DomainEventFactory).to(DomainEventFactory)
    container.bind<AxiosInstance>(TYPES.HTTPClient).toConstantValue(axios.create())
    container.bind<CrypterInterface>(TYPES.Crypter).to(CrypterNode)
    container.bind<SettingServiceInterface>(TYPES.SettingService).to(SettingService)
    container.bind<SubscriptionSettingServiceInterface>(TYPES.SubscriptionSettingService).to(SubscriptionSettingService)
    container.bind<OfflineSettingServiceInterface>(TYPES.OfflineSettingService).to(OfflineSettingService)
    container.bind<CryptoNode>(TYPES.CryptoNode).toConstantValue(new CryptoNode())
    container.bind<TimerInterface>(TYPES.Timer).toConstantValue(new Timer())
    container.bind<ContentDecoderInterface>(TYPES.ContenDecoder).toConstantValue(new ContentDecoder())
    container.bind<ClientServiceInterface>(TYPES.WebSocketsClientService).to(WebSocketsClientService)
    container.bind<RoleServiceInterface>(TYPES.RoleService).to(RoleService)
    container.bind<RoleToSubscriptionMapInterface>(TYPES.RoleToSubscriptionMap).to(RoleToSubscriptionMap)
    container.bind<SettingsAssociationServiceInterface>(TYPES.SettingsAssociationService).to(SettingsAssociationService)
    container
      .bind<SubscriptionSettingsAssociationServiceInterface>(TYPES.SubscriptionSettingsAssociationService)
      .to(SubscriptionSettingsAssociationService)
    container.bind<FeatureServiceInterface>(TYPES.FeatureService).to(FeatureService)
    container.bind<SettingInterpreterInterface>(TYPES.SettingInterpreter).to(SettingInterpreter)
    container.bind<SettingDecrypterInterface>(TYPES.SettingDecrypter).to(SettingDecrypter)
    container
      .bind<SelectorInterface<ProtocolVersion>>(TYPES.ProtocolVersionSelector)
      .toConstantValue(new DeterministicSelector<ProtocolVersion>())
    container
      .bind<SelectorInterface<boolean>>(TYPES.BooleanSelector)
      .toConstantValue(new DeterministicSelector<boolean>())
    container.bind<UserSubscriptionServiceInterface>(TYPES.UserSubscriptionService).to(UserSubscriptionService)
    container
      .bind<AnalyticsStoreInterface>(TYPES.AnalyticsStore)
      .toConstantValue(new RedisAnalyticsStore(new PeriodKeyGenerator(), container.get(TYPES.Redis)))

    if (env.get('SNS_TOPIC_ARN', true)) {
      container
        .bind<SNSDomainEventPublisher>(TYPES.DomainEventPublisher)
        .toConstantValue(new SNSDomainEventPublisher(container.get(TYPES.SNS), container.get(TYPES.SNS_TOPIC_ARN)))
    } else {
      container
        .bind<RedisDomainEventPublisher>(TYPES.DomainEventPublisher)
        .toConstantValue(
          new RedisDomainEventPublisher(container.get(TYPES.Redis), container.get(TYPES.REDIS_EVENTS_CHANNEL)),
        )
    }

    const eventHandlers: Map<string, DomainEventHandlerInterface> = new Map([
      ['USER_REGISTERED', container.get(TYPES.UserRegisteredEventHandler)],
      ['ACCOUNT_DELETION_REQUESTED', container.get(TYPES.AccountDeletionRequestedEventHandler)],
      ['SUBSCRIPTION_PURCHASED', container.get(TYPES.SubscriptionPurchasedEventHandler)],
      ['SUBSCRIPTION_CANCELLED', container.get(TYPES.SubscriptionCancelledEventHandler)],
      ['SUBSCRIPTION_RENEWED', container.get(TYPES.SubscriptionRenewedEventHandler)],
      ['SUBSCRIPTION_REFUNDED', container.get(TYPES.SubscriptionRefundedEventHandler)],
      ['SUBSCRIPTION_EXPIRED', container.get(TYPES.SubscriptionExpiredEventHandler)],
      ['SUBSCRIPTION_SYNC_REQUESTED', container.get(TYPES.SubscriptionSyncRequestedEventHandler)],
      ['EXTENSION_KEY_GRANTED', container.get(TYPES.ExtensionKeyGrantedEventHandler)],
      ['SUBSCRIPTION_REASSIGNED', container.get(TYPES.SubscriptionReassignedEventHandler)],
      ['USER_EMAIL_CHANGED', container.get(TYPES.UserEmailChangedEventHandler)],
      ['FILE_UPLOADED', container.get(TYPES.FileUploadedEventHandler)],
      ['FILE_REMOVED', container.get(TYPES.FileRemovedEventHandler)],
      ['LISTED_ACCOUNT_CREATED', container.get(TYPES.ListedAccountCreatedEventHandler)],
      ['LISTED_ACCOUNT_DELETED', container.get(TYPES.ListedAccountDeletedEventHandler)],
      [
        'USER_DISABLED_SESSION_USER_AGENT_LOGGING',
        container.get(TYPES.UserDisabledSessionUserAgentLoggingEventHandler),
      ],
      ['SHARED_SUBSCRIPTION_INVITATION_CREATED', container.get(TYPES.SharedSubscriptionInvitationCreatedEventHandler)],
      ['PREDICATE_VERIFICATION_REQUESTED', container.get(TYPES.PredicateVerificationRequestedEventHandler)],
    ])

    if (env.get('SQS_QUEUE_URL', true)) {
      container
        .bind<DomainEventMessageHandlerInterface>(TYPES.DomainEventMessageHandler)
        .toConstantValue(
          env.get('NEW_RELIC_ENABLED', true) === 'true'
            ? new SQSNewRelicEventMessageHandler(eventHandlers, container.get(TYPES.Logger))
            : new SQSEventMessageHandler(eventHandlers, container.get(TYPES.Logger)),
        )
      container
        .bind<DomainEventSubscriberFactoryInterface>(TYPES.DomainEventSubscriberFactory)
        .toConstantValue(
          new SQSDomainEventSubscriberFactory(
            container.get(TYPES.SQS),
            container.get(TYPES.SQS_QUEUE_URL),
            container.get(TYPES.DomainEventMessageHandler),
          ),
        )
    } else {
      container
        .bind<DomainEventMessageHandlerInterface>(TYPES.DomainEventMessageHandler)
        .toConstantValue(new RedisEventMessageHandler(eventHandlers, container.get(TYPES.Logger)))
      container
        .bind<DomainEventSubscriberFactoryInterface>(TYPES.DomainEventSubscriberFactory)
        .toConstantValue(
          new RedisDomainEventSubscriberFactory(
            container.get(TYPES.Redis),
            container.get(TYPES.DomainEventMessageHandler),
            container.get(TYPES.REDIS_EVENTS_CHANNEL),
          ),
        )
    }

    return container
  }
}
