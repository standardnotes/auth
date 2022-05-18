const TYPES = {
  Logger: Symbol.for('Logger'),
  Redis: Symbol.for('Redis'),
  SNS: Symbol.for('SNS'),
  SQS: Symbol.for('SQS'),
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  SessionRepository: Symbol.for('SessionRepository'),
  EphemeralSessionRepository: Symbol.for('EphemeralSessionRepository'),
  RevokedSessionRepository: Symbol.for('RevokedSessionRepository'),
  SettingRepository: Symbol.for('SettingRepository'),
  SubscriptionSettingRepository: Symbol.for('SubscriptionSettingRepository'),
  OfflineSettingRepository: Symbol.for('OfflineSettingRepository'),
  LockRepository: Symbol.for('LockRepository'),
  RoleRepository: Symbol.for('RoleRepository'),
  WebSocketsConnectionRepository: Symbol.for('WebSocketsConnectionRepository'),
  UserSubscriptionRepository: Symbol.for('UserSubscriptionRepository'),
  OfflineUserSubscriptionRepository: Symbol.for('OfflineUserSubscriptionRepository'),
  SubscriptionTokenRepository: Symbol.for('SubscriptionTokenRepository'),
  OfflineSubscriptionTokenRepository: Symbol.for('OfflineSubscriptionTokenRepository'),
  SharedSubscriptionInvitationRepository: Symbol.for('SharedSubscriptionInvitationRepository'),
  PKCERepository: Symbol.for('PKCERepository'),
  AnalyticsEntityRepository: Symbol.for('AnalyticsEntityRepository'),
  // ORM
  ORMOfflineSettingRepository: Symbol.for('ORMOfflineSettingRepository'),
  ORMOfflineUserSubscriptionRepository: Symbol.for('ORMOfflineUserSubscriptionRepository'),
  ORMRevokedSessionRepository: Symbol.for('ORMRevokedSessionRepository'),
  ORMRoleRepository: Symbol.for('ORMRoleRepository'),
  ORMSessionRepository: Symbol.for('ORMSessionRepository'),
  ORMSettingRepository: Symbol.for('ORMSettingRepository'),
  ORMSharedSubscriptionInvitationRepository: Symbol.for('ORMSharedSubscriptionInvitationRepository'),
  ORMSubscriptionSettingRepository: Symbol.for('ORMSubscriptionSettingRepository'),
  ORMUserRepository: Symbol.for('ORMUserRepository'),
  ORMUserSubscriptionRepository: Symbol.for('ORMUserSubscriptionRepository'),
  ORMAnalyticsEntityRepository: Symbol.for('ORMAnalyticsEntityRepository'),
  // Middleware
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  ApiGatewayAuthMiddleware: Symbol.for('ApiGatewayAuthMiddleware'),
  ApiGatewayOfflineAuthMiddleware: Symbol.for('ApiGatewayOfflineAuthMiddleware'),
  OfflineUserAuthMiddleware: Symbol.for('OfflineUserAuthMiddleware'),
  AuthMiddlewareWithoutResponse: Symbol.for('AuthMiddlewareWithoutResponse'),
  LockMiddleware: Symbol.for('LockMiddleware'),
  SessionMiddleware: Symbol.for('SessionMiddleware'),
  // Projectors
  SessionProjector: Symbol.for('SessionProjector'),
  UserProjector: Symbol.for('UserProjector'),
  RoleProjector: Symbol.for('RoleProjector'),
  PermissionProjector: Symbol.for('PermissionProjector'),
  SettingProjector: Symbol.for('SettingProjector'),
  SubscriptionSettingProjector: Symbol.for('SubscriptionSettingProjector'),
  // Factories
  SettingFactory: Symbol.for('SettingFactory'),
  // env vars
  JWT_SECRET: Symbol.for('JWT_SECRET'),
  LEGACY_JWT_SECRET: Symbol.for('LEGACY_JWT_SECRET'),
  AUTH_JWT_SECRET: Symbol.for('AUTH_JWT_SECRET'),
  AUTH_JWT_TTL: Symbol.for('AUTH_JWT_TTL'),
  VALET_TOKEN_SECRET: Symbol.for('VALET_TOKEN_SECRET'),
  VALET_TOKEN_TTL: Symbol.for('VALET_TOKEN_TTL'),
  ENCRYPTION_SERVER_KEY: Symbol.for('ENCRYPTION_SERVER_KEY'),
  ACCESS_TOKEN_AGE: Symbol.for('ACCESS_TOKEN_AGE'),
  REFRESH_TOKEN_AGE: Symbol.for('REFRESH_TOKEN_AGE'),
  EPHEMERAL_SESSION_AGE: Symbol.for('EPHEMERAL_SESSION_AGE'),
  MAX_LOGIN_ATTEMPTS: Symbol.for('MAX_LOGIN_ATTEMPTS'),
  FAILED_LOGIN_LOCKOUT: Symbol.for('FAILED_LOGIN_LOCKOUT'),
  PSEUDO_KEY_PARAMS_KEY: Symbol.for('PSEUDO_KEY_PARAMS_KEY'),
  REDIS_URL: Symbol.for('REDIS_URL'),
  DISABLE_USER_REGISTRATION: Symbol.for('DISABLE_USER_REGISTRATION'),
  SNS_TOPIC_ARN: Symbol.for('SNS_TOPIC_ARN'),
  SNS_AWS_REGION: Symbol.for('SNS_AWS_REGION'),
  SQS_QUEUE_URL: Symbol.for('SQS_QUEUE_URL'),
  SQS_AWS_REGION: Symbol.for('SQS_AWS_REGION'),
  USER_SERVER_REGISTRATION_URL: Symbol.for('USER_SERVER_REGISTRATION_URL'),
  USER_SERVER_AUTH_KEY: Symbol.for('USER_SERVER_AUTH_KEY'),
  USER_SERVER_CHANGE_EMAIL_URL: Symbol.for('USER_SERVER_CHANGE_EMAIL_URL'),
  REDIS_EVENTS_CHANNEL: Symbol.for('REDIS_EVENTS_CHANNEL'),
  NEW_RELIC_ENABLED: Symbol.for('NEW_RELIC_ENABLED'),
  SYNCING_SERVER_URL: Symbol.for('SYNCING_SERVER_URL'),
  WEBSOCKETS_API_URL: Symbol.for('WEBSOCKETS_API_URL'),
  VERSION: Symbol.for('VERSION'),
  PAYMENTS_SERVER_URL: Symbol.for('PAYMENTS_SERVER_URL'),
  // use cases
  AuthenticateUser: Symbol.for('AuthenticateUser'),
  AuthenticateRequest: Symbol.for('AuthenticateRequest'),
  RefreshSessionToken: Symbol.for('RefreshSessionToken'),
  VerifyMFA: Symbol.for('VerifyMFA'),
  SignIn: Symbol.for('SignIn'),
  ClearLoginAttempts: Symbol.for('ClearLoginAttempts'),
  IncreaseLoginAttempts: Symbol.for('IncreaseLoginAttempts'),
  GetUserKeyParams: Symbol.for('GetUserKeyParams'),
  UpdateUser: Symbol.for('UpdateUser'),
  Register: Symbol.for('Register'),
  GetActiveSessionsForUser: Symbol.for('GetActiveSessionsForUser'),
  DeletePreviousSessionsForUser: Symbol.for('DeletePreviousSessionsForUser'),
  DeleteSessionForUser: Symbol.for('DeleteSessionForUser'),
  ChangeCredentials: Symbol.for('ChangePassword'),
  GetSettings: Symbol.for('GetSettings'),
  GetSetting: Symbol.for('GetSetting'),
  GetUserFeatures: Symbol.for('GetUserFeatures'),
  UpdateSetting: Symbol.for('UpdateSetting'),
  DeleteSetting: Symbol.for('DeleteSetting'),
  DeleteAccount: Symbol.for('DeleteAccount'),
  AddWebSocketsConnection: Symbol.for('AddWebSocketsConnection'),
  RemoveWebSocketsConnection: Symbol.for('RemoveWebSocketsConnection'),
  GetUserSubscription: Symbol.for('GetUserSubscription'),
  GetUserOfflineSubscription: Symbol.for('GetUserOfflineSubscription'),
  CreateSubscriptionToken: Symbol.for('CreateSubscriptionToken'),
  AuthenticateSubscriptionToken: Symbol.for('AuthenticateSubscriptionToken'),
  CreateOfflineSubscriptionToken: Symbol.for('CreateOfflineSubscriptionToken'),
  AuthenticateOfflineSubscriptionToken: Symbol.for('AuthenticateOfflineSubscriptionToken'),
  MuteFailedBackupsEmails: Symbol.for('MuteFailedBackupsEmails'),
  MuteSignInEmails: Symbol.for('MuteSignInEmails'),
  CreateValetToken: Symbol.for('CreateValetToken'),
  CreateListedAccount: Symbol.for('CreateListedAccount'),
  InviteToSharedSubscription: Symbol.for('InviteToSharedSubscription'),
  AcceptSharedSubscriptionInvitation: Symbol.for('AcceptSharedSubscriptionInvitation'),
  DeclineSharedSubscriptionInvitation: Symbol.for('DeclineSharedSubscriptionInvitation'),
  CancelSharedSubscriptionInvitation: Symbol.for('CancelSharedSubscriptionInvitation'),
  ListSharedSubscriptionInvitations: Symbol.for('ListSharedSubscriptionInvitations'),
  GetSubscriptionSetting: Symbol.for('GetSubscriptionSetting'),
  // Handlers
  UserRegisteredEventHandler: Symbol.for('UserRegisteredEventHandler'),
  AccountDeletionRequestedEventHandler: Symbol.for('AccountDeletionRequestedEventHandler'),
  SubscriptionPurchasedEventHandler: Symbol.for('SubscriptionPurchasedEventHandler'),
  SubscriptionCancelledEventHandler: Symbol.for('SubscriptionCancelledEventHandler'),
  SubscriptionReassignedEventHandler: Symbol.for('SubscriptionReassignedEventHandler'),
  SubscriptionRenewedEventHandler: Symbol.for('SubscriptionRenewedEventHandler'),
  SubscriptionRefundedEventHandler: Symbol.for('SubscriptionRefundedEventHandler'),
  SubscriptionExpiredEventHandler: Symbol.for('SubscriptionExpiredEventHandler'),
  SubscriptionSyncRequestedEventHandler: Symbol.for('SubscriptionSyncRequestedEventHandler'),
  ExtensionKeyGrantedEventHandler: Symbol.for('ExtensionKeyGrantedEventHandler'),
  UserEmailChangedEventHandler: Symbol.for('UserEmailChangedEventHandler'),
  FileUploadedEventHandler: Symbol.for('FileUploadedEventHandler'),
  FileRemovedEventHandler: Symbol.for('FileRemovedEventHandler'),
  ListedAccountCreatedEventHandler: Symbol.for('ListedAccountCreatedEventHandler'),
  ListedAccountDeletedEventHandler: Symbol.for('ListedAccountDeletedEventHandler'),
  UserDisabledSessionUserAgentLoggingEventHandler: Symbol.for('UserDisabledSessionUserAgentLoggingEventHandler'),
  SharedSubscriptionInvitationCreatedEventHandler: Symbol.for('SharedSubscriptionInvitationCreatedEventHandler'),
  // Services
  DeviceDetector: Symbol.for('DeviceDetector'),
  SessionService: Symbol.for('SessionService'),
  SettingService: Symbol.for('SettingService'),
  SubscriptionSettingService: Symbol.for('SubscriptionSettingService'),
  OfflineSettingService: Symbol.for('OfflineSettingService'),
  AuthResponseFactory20161215: Symbol.for('AuthResponseFactory20161215'),
  AuthResponseFactory20190520: Symbol.for('AuthResponseFactory20190520'),
  AuthResponseFactory20200115: Symbol.for('AuthResponseFactory20200115'),
  AuthResponseFactoryResolver: Symbol.for('AuthResponseFactoryResolver'),
  KeyParamsFactory: Symbol.for('KeyParamsFactory'),
  SessionTokenDecoder: Symbol.for('SessionTokenDecoder'),
  FallbackSessionTokenDecoder: Symbol.for('FallbackSessionTokenDecoder'),
  CrossServiceTokenDecoder: Symbol.for('CrossServiceTokenDecoder'),
  OfflineUserTokenDecoder: Symbol.for('OfflineUserTokenDecoder'),
  OfflineUserTokenEncoder: Symbol.for('OfflineUserTokenEncoder'),
  CrossServiceTokenEncoder: Symbol.for('CrossServiceTokenEncoder'),
  SessionTokenEncoder: Symbol.for('SessionTokenEncoder'),
  ValetTokenEncoder: Symbol.for('ValetTokenEncoder'),
  AuthenticationMethodResolver: Symbol.for('AuthenticationMethodResolver'),
  DomainEventPublisher: Symbol.for('DomainEventPublisher'),
  DomainEventSubscriberFactory: Symbol.for('DomainEventSubscriberFactory'),
  DomainEventFactory: Symbol.for('DomainEventFactory'),
  DomainEventMessageHandler: Symbol.for('DomainEventMessageHandler'),
  HTTPClient: Symbol.for('HTTPClient'),
  Crypter: Symbol.for('Crypter'),
  CryptoNode: Symbol.for('CryptoNode'),
  Timer: Symbol.for('Timer'),
  ContenDecoder: Symbol.for('ContenDecoder'),
  WebSocketsClientService: Symbol.for('WebSocketClientService'),
  RoleService: Symbol.for('RoleService'),
  RoleToSubscriptionMap: Symbol.for('RoleToSubscriptionMap'),
  SettingsAssociationService: Symbol.for('SettingsAssociationService'),
  SubscriptionSettingsAssociationService: Symbol.for('SubscriptionSettingsAssociationService'),
  FeatureService: Symbol.for('FeatureService'),
  SettingDecrypter: Symbol.for('SettingDecrypter'),
  SettingInterpreter: Symbol.for('SettingInterpreter'),
  ProtocolVersionSelector: Symbol.for('ProtocolVersionSelector'),
  BooleanSelector: Symbol.for('BooleanSelector'),
  UserSubscriptionService: Symbol.for('UserSubscriptionService'),
}

export default TYPES
