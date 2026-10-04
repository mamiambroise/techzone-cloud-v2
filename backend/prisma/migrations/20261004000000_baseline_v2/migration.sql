--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1


--
-- Name: business_manager; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS business_manager;


--
-- Name: AdjustmentType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."AdjustmentType" AS ENUM (
    'MANUAL_CORRECTION',
    'COMMERCIAL_GESTURE',
    'USAGE_CORRECTION',
    'BILLING_CORRECTION'
);


--
-- Name: AdminActionStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."AdminActionStatus" AS ENUM (
    'REQUESTED',
    'PENDING_APPROVAL',
    'APPROVED',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


--
-- Name: ApiAuthenticationType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ApiAuthenticationType" AS ENUM (
    'NONE',
    'API_KEY',
    'BEARER',
    'OAUTH2',
    'BASIC',
    'CUSTOM'
);


--
-- Name: ApiStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ApiStatus" AS ENUM (
    'DRAFT',
    'VALIDATING',
    'READY',
    'ACTIVE',
    'DEPRECATED',
    'RETIRED'
);


--
-- Name: ApplicationStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ApplicationStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'DISABLED'
);


--
-- Name: ApplicationVersionStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ApplicationVersionStatus" AS ENUM (
    'DRAFT',
    'CONFIGURING',
    'VALIDATING',
    'READY',
    'ACTIVE',
    'SUPERSEDED',
    'DEPRECATED',
    'ARCHIVED'
);


--
-- Name: AuthorizationResult; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."AuthorizationResult" AS ENUM (
    'ALLOW',
    'DENY',
    'STEP_UP_REQUIRED',
    'APPROVAL_REQUIRED'
);


--
-- Name: BillingAccountStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BillingAccountStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'CLOSED'
);


--
-- Name: BillingDiagnosticStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BillingDiagnosticStatus" AS ENUM (
    'HEALTHY',
    'WARNING',
    'DEGRADED',
    'CRITICAL',
    'UNKNOWN'
);


--
-- Name: BillingInterval; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BillingInterval" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'SEMI_ANNUAL',
    'ANNUAL',
    'CUSTOM'
);


--
-- Name: BillingStage; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BillingStage" AS ENUM (
    'SUBSCRIPTION_RESOLVER',
    'ENTITLEMENT_RESOLVER',
    'METERING',
    'INVOICE_GENERATION',
    'PAYMENT_PROVIDER',
    'WEBHOOK',
    'RENEWAL',
    'ERP_SYNC'
);


--
-- Name: BmCapabilityStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmCapabilityStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'DEPRECATED',
    'ARCHIVED'
);


--
-- Name: BmConstraintType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmConstraintType" AS ENUM (
    'PRIMARY',
    'UNIQUE',
    'NOT_NULL',
    'VALUE_RANGE',
    'FORMAT',
    'RELATION',
    'COMPOSITE_UNIQUE',
    'DECLARATIVE_CUSTOM'
);


--
-- Name: BmContractStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmContractStatus" AS ENUM (
    'DRAFT',
    'VALIDATING',
    'LOCKED',
    'ACTIVE',
    'DEPRECATED',
    'RETIRED'
);


--
-- Name: BmDataClassification; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmDataClassification" AS ENUM (
    'PUBLIC',
    'INTERNAL',
    'CONFIDENTIAL',
    'SENSITIVE'
);


--
-- Name: BmDataScope; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmDataScope" AS ENUM (
    'GLOBAL',
    'ORGANIZATION',
    'SITE',
    'USER',
    'CONTEXT'
);


--
-- Name: BmDataTypeCode; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmDataTypeCode" AS ENUM (
    'TEXT',
    'LONG_TEXT',
    'INTEGER',
    'BIG_INTEGER',
    'DECIMAL',
    'CURRENCY',
    'PERCENTAGE',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'TIME',
    'EMAIL',
    'PHONE',
    'URL',
    'ENUM',
    'MULTI_ENUM',
    'UUID',
    'SEQUENCE',
    'FILE',
    'IMAGE',
    'JSON',
    'RELATION',
    'FORMULA'
);


--
-- Name: BmDeleteBehavior; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmDeleteBehavior" AS ENUM (
    'RESTRICT',
    'CASCADE',
    'SET_NULL'
);


--
-- Name: BmDependencyType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmDependencyType" AS ENUM (
    'REQUIRED',
    'OPTIONAL',
    'CONFLICTS_WITH'
);


--
-- Name: BmEntityStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmEntityStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ARCHIVED'
);


--
-- Name: BmFeatureStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmFeatureStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'DEPRECATED',
    'ARCHIVED'
);


--
-- Name: BmIndexType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmIndexType" AS ENUM (
    'SIMPLE',
    'UNIQUE',
    'COMPOSITE'
);


--
-- Name: BmMenuItemType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmMenuItemType" AS ENUM (
    'LINK',
    'GROUP',
    'SEPARATOR',
    'EXTERNAL_LINK'
);


--
-- Name: BmMenuLocation; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmMenuLocation" AS ENUM (
    'SIDEBAR',
    'TOPBAR',
    'CONTEXT_MENU',
    'FOOTER',
    'DASHBOARD',
    'CUSTOM'
);


--
-- Name: BmNavigationStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmNavigationStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ARCHIVED'
);


--
-- Name: BmNavigationVisibility; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmNavigationVisibility" AS ENUM (
    'VISIBLE',
    'HIDDEN',
    'DISABLED'
);


--
-- Name: BmRelationType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmRelationType" AS ENUM (
    'ONE_TO_ONE',
    'ONE_TO_MANY',
    'MANY_TO_ONE',
    'MANY_TO_MANY'
);


--
-- Name: BmRuntimeReadiness; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmRuntimeReadiness" AS ENUM (
    'NOT_READY',
    'READY',
    'ERROR',
    'DEGRADED'
);


--
-- Name: BmValidationType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmValidationType" AS ENUM (
    'REQUIRED',
    'MIN',
    'MAX',
    'MIN_LENGTH',
    'MAX_LENGTH',
    'REGEX',
    'EMAIL',
    'URL',
    'ALLOWED_VALUES',
    'PRECISION',
    'SCALE'
);


--
-- Name: BmqGateResult; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmqGateResult" AS ENUM (
    'PASS',
    'WARNING',
    'FAIL',
    'BLOCKED'
);


--
-- Name: BmqSeverity; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmqSeverity" AS ENUM (
    'INFO',
    'WARNING',
    'ERROR',
    'BLOCKER'
);


--
-- Name: BmqStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."BmqStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'PASSED',
    'WARNING',
    'FAILED',
    'BLOCKED',
    'CANCELLED'
);


--
-- Name: CancellationMode; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."CancellationMode" AS ENUM (
    'IMMEDIATE',
    'END_OF_PERIOD'
);


--
-- Name: ConfigurationHistoryAction; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConfigurationHistoryAction" AS ENUM (
    'CREATED',
    'UPDATED',
    'VALIDATED',
    'ACTIVATED',
    'DEPRECATED',
    'ARCHIVED'
);


--
-- Name: ConfigurationScope; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConfigurationScope" AS ENUM (
    'PLATFORM',
    'APPLICATION',
    'APPLICATION_VERSION',
    'ENVIRONMENT',
    'TENANT'
);


--
-- Name: ConfigurationStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConfigurationStatus" AS ENUM (
    'DRAFT',
    'VALIDATING',
    'READY',
    'ACTIVE',
    'DEPRECATED',
    'ARCHIVED'
);


--
-- Name: ConfigurationType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConfigurationType" AS ENUM (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'ENUM',
    'JSON',
    'URL',
    'DURATION'
);


--
-- Name: ConnectorHealthStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConnectorHealthStatus" AS ENUM (
    'HEALTHY',
    'WARNING',
    'DEGRADED',
    'CRITICAL',
    'UNKNOWN'
);


--
-- Name: ConnectorProviderType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConnectorProviderType" AS ENUM (
    'REST',
    'GRAPHQL',
    'DATABASE_ADAPTER',
    'FILE',
    'MESSAGE_QUEUE',
    'CUSTOM_PROVIDER'
);


--
-- Name: ConnectorStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ConnectorStatus" AS ENUM (
    'DRAFT',
    'CONFIGURING',
    'VALIDATING',
    'READY',
    'ACTIVE',
    'DEGRADED',
    'DISABLED',
    'ARCHIVED'
);


--
-- Name: ContractHistoryAction; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ContractHistoryAction" AS ENUM (
    'CREATED',
    'VALIDATED',
    'LOCKED',
    'ACTIVATED',
    'DEPRECATED',
    'RETIRED',
    'COMPATIBILITY_CHECKED'
);


--
-- Name: ContractParticipantType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ContractParticipantType" AS ENUM (
    'APPLICATION',
    'PACK',
    'SERVICE',
    'TEAM',
    'EXTERNAL'
);


--
-- Name: ContractStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ContractStatus" AS ENUM (
    'DRAFT',
    'VALIDATING',
    'LOCKED',
    'ACTIVE',
    'DEPRECATED',
    'RETIRED'
);


--
-- Name: CredentialStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."CredentialStatus" AS ENUM (
    'ACTIVE',
    'DISABLED',
    'EXPIRED',
    'ROTATION_REQUIRED',
    'ARCHIVED'
);


--
-- Name: CredentialType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."CredentialType" AS ENUM (
    'API_KEY',
    'BASIC_AUTH',
    'BEARER_TOKEN',
    'OAUTH_CLIENT',
    'CERTIFICATE_REFERENCE',
    'CUSTOM_SECRET_REFERENCE'
);


--
-- Name: CreditStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."CreditStatus" AS ENUM (
    'AVAILABLE',
    'PARTIALLY_APPLIED',
    'APPLIED',
    'EXPIRED',
    'CANCELLED'
);


--
-- Name: DelegationStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DelegationStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'REVOKED',
    'EXPIRED'
);


--
-- Name: DeploymentGateResult; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DeploymentGateResult" AS ENUM (
    'PASSED',
    'FAILED',
    'WARNING',
    'SKIPPED',
    'NOT_APPLICABLE'
);


--
-- Name: DeploymentGateType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DeploymentGateType" AS ENUM (
    'CONTRACT_COMPATIBILITY',
    'SNAPSHOT_VALID',
    'CONFIGURATION_VALID',
    'BUILD_AVAILABLE',
    'TESTS_PASS',
    'SECURITY_CHECK',
    'ENVIRONMENT_READY',
    'HEALTH_PRECHECK',
    'MANUAL_APPROVAL',
    'CUSTOM_REGISTERED_GATE'
);


--
-- Name: DeploymentHistoryAction; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DeploymentHistoryAction" AS ENUM (
    'CREATED',
    'VALIDATING',
    'GATE_CHECK',
    'STARTED',
    'HEALTH_CHECK',
    'SUCCEEDED',
    'FAILED',
    'ROLLBACK_STARTED',
    'ROLLBACK_COMPLETED',
    'CANCELLED'
);


--
-- Name: DeploymentStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DeploymentStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'VERIFYING',
    'SUCCEEDED',
    'FAILED',
    'ROLLED_BACK',
    'CANCELLED'
);


--
-- Name: DeploymentStrategy; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DeploymentStrategy" AS ENUM (
    'STANDARD',
    'ROLLING',
    'BLUE_GREEN',
    'CANARY'
);


--
-- Name: DeviceTrustLevel; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DeviceTrustLevel" AS ENUM (
    'UNKNOWN',
    'UNTRUSTED',
    'TRUSTED',
    'PRIVILEGED'
);


--
-- Name: DiagnosticStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."DiagnosticStatus" AS ENUM (
    'HEALTHY',
    'DEGRADED',
    'WARNING',
    'CRITICAL',
    'UNAVAILABLE',
    'UNKNOWN'
);


--
-- Name: EnforcementPolicy; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EnforcementPolicy" AS ENUM (
    'SOFT_LIMIT',
    'HARD_LIMIT',
    'OVERAGE',
    'NOTIFY_ONLY'
);


--
-- Name: EntitlementKind; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EntitlementKind" AS ENUM (
    'BOOLEAN',
    'LIMIT',
    'QUOTA',
    'CAPABILITY'
);


--
-- Name: EntitlementValueType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EntitlementValueType" AS ENUM (
    'BOOLEAN',
    'INTEGER',
    'DECIMAL',
    'STRING',
    'JSON'
);


--
-- Name: EnvironmentDeploymentStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EnvironmentDeploymentStatus" AS ENUM (
    'ACTIVE',
    'DEPLOYING',
    'FAILED',
    'ROLLED_BACK',
    'DRIFTED',
    'LOCKED'
);


--
-- Name: EnvironmentHistoryAction; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EnvironmentHistoryAction" AS ENUM (
    'CREATED',
    'UPDATED',
    'STATUS_CHANGED',
    'CONFIGURATION_CHANGED',
    'ARCHIVED'
);


--
-- Name: EnvironmentStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EnvironmentStatus" AS ENUM (
    'ACTIVE',
    'MAINTENANCE',
    'DEGRADED',
    'DISABLED',
    'ARCHIVED'
);


--
-- Name: EnvironmentType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."EnvironmentType" AS ENUM (
    'DEVELOPMENT',
    'TEST',
    'STAGING',
    'PRODUCTION'
);


--
-- Name: GroupType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."GroupType" AS ENUM (
    'SYSTEM',
    'STATIC',
    'DYNAMIC'
);


--
-- Name: IamCredentialStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IamCredentialStatus" AS ENUM (
    'ACTIVE',
    'DISABLED',
    'REVOKED',
    'EXPIRED'
);


--
-- Name: IamCredentialType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IamCredentialType" AS ENUM (
    'PASSWORD',
    'PASSKEY',
    'API_KEY',
    'EXTERNAL',
    'RECOVERY'
);


--
-- Name: IamEnvironment; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IamEnvironment" AS ENUM (
    'DEVELOPMENT',
    'TEST',
    'STAGING',
    'PRODUCTION'
);


--
-- Name: IdentityStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IdentityStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED'
);


--
-- Name: IdentityType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IdentityType" AS ENUM (
    'HUMAN',
    'SERVICE_ACCOUNT',
    'APPLICATION',
    'DEVICE',
    'SYSTEM',
    'EXTERNAL_IDENTITY',
    'API_CLIENT',
    'AUTOMATION',
    'AGENT'
);


--
-- Name: IntegrationLogDirection; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IntegrationLogDirection" AS ENUM (
    'INBOUND',
    'OUTBOUND'
);


--
-- Name: IntegrationLogStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."IntegrationLogStatus" AS ENUM (
    'STARTED',
    'SUCCEEDED',
    'FAILED',
    'TIMEOUT',
    'RETRYING',
    'CANCELLED'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."InvoiceStatus" AS ENUM (
    'DRAFT',
    'OPEN',
    'PAID',
    'PARTIALLY_PAID',
    'OVERDUE',
    'VOID',
    'CANCELLED'
);


--
-- Name: MembershipStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."MembershipStatus" AS ENUM (
    'INVITED',
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'REVOKED',
    'EXPIRED'
);


--
-- Name: MeterAggregation; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."MeterAggregation" AS ENUM (
    'SUM',
    'MAX',
    'COUNT',
    'LAST'
);


--
-- Name: MeterPeriod; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."MeterPeriod" AS ENUM (
    'BILLING_PERIOD',
    'MONTH',
    'DAY',
    'YEAR'
);


--
-- Name: MfaType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."MfaType" AS ENUM (
    'TOTP',
    'EMAIL_OTP',
    'SMS_OTP',
    'PASSKEY'
);


--
-- Name: OrganizationStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."OrganizationStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PaymentMethod" AS ENUM (
    'MANUAL',
    'BANK_TRANSFER',
    'MOBILE_MONEY',
    'CARD',
    'CASH',
    'GATEWAY'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


--
-- Name: PlanStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PlanStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'DEPRECATED',
    'ARCHIVED'
);


--
-- Name: PlatformServiceStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PlatformServiceStatus" AS ENUM (
    'STARTING',
    'HEALTHY',
    'DEGRADED',
    'UNAVAILABLE',
    'MAINTENANCE'
);


--
-- Name: PolicyEffect; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PolicyEffect" AS ENUM (
    'ALLOW',
    'DENY',
    'STEP_UP',
    'APPROVAL_REQUIRED'
);


--
-- Name: PolicyStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PolicyStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'DISABLED',
    'SUPERSEDED',
    'ARCHIVED'
);


--
-- Name: PriceStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PriceStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'INACTIVE'
);


--
-- Name: PricingModel; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."PricingModel" AS ENUM (
    'FLAT',
    'PER_SEAT',
    'TIERED',
    'USAGE_BASED',
    'HYBRID',
    'CUSTOM'
);


--
-- Name: ReleaseStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ReleaseStatus" AS ENUM (
    'DRAFT',
    'ASSEMBLING',
    'VALIDATING',
    'READY',
    'APPROVED',
    'RELEASED',
    'SUPERSEDED',
    'ARCHIVED'
);


--
-- Name: RiskLevel; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."RiskLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: RoleStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."RoleStatus" AS ENUM (
    'ACTIVE',
    'DISABLED',
    'ARCHIVED'
);


--
-- Name: RollbackStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."RollbackStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED'
);


--
-- Name: RollbackType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."RollbackType" AS ENUM (
    'MANUAL_ROLLBACK',
    'AUTOMATIC_ROLLBACK',
    'REDEPLOY_PREVIOUS'
);


--
-- Name: SecuritySeverity; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SecuritySeverity" AS ENUM (
    'INFO',
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: ServiceAccountStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."ServiceAccountStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DISABLED',
    'ARCHIVED'
);


--
-- Name: SessionStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SessionStatus" AS ENUM (
    'ACTIVE',
    'REVOKED',
    'EXPIRED'
);


--
-- Name: SiteStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SiteStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED'
);


--
-- Name: SnapshotHistoryAction; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SnapshotHistoryAction" AS ENUM (
    'CREATED',
    'CHANGED',
    'VALIDATED',
    'ACTIVATED',
    'ARCHIVED'
);


--
-- Name: SnapshotStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SnapshotStatus" AS ENUM (
    'DRAFT',
    'VALIDATING',
    'VALID',
    'INVALID',
    'ACTIVE',
    'ARCHIVED'
);


--
-- Name: SubscriptionStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SubscriptionStatus" AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'SUSPENDED',
    'CANCELLED',
    'EXPIRED',
    'DRAFT',
    'GRACE_PERIOD',
    'ENDED'
);


--
-- Name: SynchronizationDirection; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SynchronizationDirection" AS ENUM (
    'PULL',
    'PUSH',
    'BIDIRECTIONAL'
);


--
-- Name: SynchronizationMode; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SynchronizationMode" AS ENUM (
    'FULL',
    'INCREMENTAL'
);


--
-- Name: SynchronizationStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."SynchronizationStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCEEDED',
    'PARTIAL',
    'FAILED',
    'PAUSED',
    'CANCELLED'
);


--
-- Name: TenantStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."TenantStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'DISABLED',
    'ARCHIVED'
);


--
-- Name: TokenStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."TokenStatus" AS ENUM (
    'ACTIVE',
    'ROTATED',
    'REVOKED',
    'EXPIRED',
    'REUSED'
);


--
-- Name: UiPageLayout; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."UiPageLayout" AS ENUM (
    'SIDEBAR',
    'FULL_WIDTH',
    'CENTERED'
);


--
-- Name: UiPageType; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."UiPageType" AS ENUM (
    'LIST',
    'DETAIL',
    'FORM',
    'DASHBOARD',
    'CUSTOM'
);


--
-- Name: UiPageVisibility; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."UiPageVisibility" AS ENUM (
    'ALWAYS',
    'TENANT_ADMIN_ONLY',
    'HIDDEN'
);


--
-- Name: UiThemeStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."UiThemeStatus" AS ENUM (
    'DRAFT',
    'READY'
);


--
-- Name: UserStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."UserStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'LOCKED',
    'DISABLED',
    'ARCHIVED'
);


--
-- Name: WebhookDeliveryStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."WebhookDeliveryStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'RETRYING',
    'CANCELLED'
);


--
-- Name: WebhookDirection; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."WebhookDirection" AS ENUM (
    'INBOUND',
    'OUTBOUND'
);


--
-- Name: WebhookStatus; Type: TYPE; Schema: business_manager; Owner: -
--

CREATE TYPE business_manager."WebhookStatus" AS ENUM (
    'DRAFT',
    'CONFIGURING',
    'VALIDATING',
    'READY',
    'ACTIVE',
    'DISABLED',
    'ARCHIVED'
);




--
-- Name: access_policy; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.access_policy (
    id text NOT NULL,
    "tenantId" text,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."PolicyStatus" DEFAULT 'DRAFT'::business_manager."PolicyStatus" NOT NULL,
    effect business_manager."PolicyEffect" NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    resource text,
    action text,
    "subjectType" text,
    "subjectRef" text,
    version integer DEFAULT 1 NOT NULL,
    "effectiveFrom" timestamp(3) without time zone,
    "effectiveUntil" timestamp(3) without time zone,
    "publishedAt" timestamp(3) without time zone,
    "supersededById" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone
);


--
-- Name: adapter_registry; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.adapter_registry (
    id text NOT NULL,
    adapter_id text NOT NULL,
    nom text NOT NULL,
    version text NOT NULL,
    erp_family text NOT NULL,
    capabilities jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: admin_delegation; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.admin_delegation (
    id text NOT NULL,
    "tenantId" text,
    "grantorUserId" text NOT NULL,
    "granteeUserId" text NOT NULL,
    "scopeType" text NOT NULL,
    "scopeId" text,
    permissions jsonb NOT NULL,
    status business_manager."DelegationStatus" DEFAULT 'ACTIVE'::business_manager."DelegationStatus" NOT NULL,
    "validFrom" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validUntil" timestamp(3) without time zone,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text
);


--
-- Name: administrative_action; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.administrative_action (
    id text NOT NULL,
    "traceId" text,
    "actorId" text NOT NULL,
    "tenantId" text,
    "actionType" text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text,
    status business_manager."AdminActionStatus" DEFAULT 'REQUESTED'::business_manager."AdminActionStatus" NOT NULL,
    reason text,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "executedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "failureReason" text,
    metadata jsonb
);


--
-- Name: api_definitions; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.api_definitions (
    id uuid NOT NULL,
    "apiCode" character varying(100) NOT NULL,
    version character varying(50) NOT NULL,
    "basePath" character varying(255) NOT NULL,
    operations jsonb NOT NULL,
    authentication business_manager."ApiAuthenticationType" DEFAULT 'BEARER'::business_manager."ApiAuthenticationType" NOT NULL,
    "authorization" jsonb,
    "rateLimit" jsonb,
    "requestSchema" jsonb,
    "responseSchema" jsonb,
    status business_manager."ApiStatus" DEFAULT 'DRAFT'::business_manager."ApiStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone
);


--
-- Name: application_versions; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.application_versions (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    version character varying(50) NOT NULL,
    status business_manager."ApplicationVersionStatus" DEFAULT 'DRAFT'::business_manager."ApplicationVersionStatus" NOT NULL,
    "releaseNotes" text,
    "createdFrom" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: applications; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.applications (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status business_manager."ApplicationStatus" DEFAULT 'ACTIVE'::business_manager."ApplicationStatus" NOT NULL,
    "tenantScope" character varying(100) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: audit_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.audit_event (
    id text NOT NULL,
    "traceId" text NOT NULL,
    "actorId" text,
    "effectiveIdentityId" text,
    "effectiveUserId" text,
    "tenantId" text,
    "organizationId" text,
    "siteId" text,
    "sessionId" text,
    action text NOT NULL,
    "targetType" text,
    "targetId" text,
    result text NOT NULL,
    reason text,
    before jsonb,
    after jsonb,
    metadata jsonb,
    "previousHash" text,
    "eventHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: authorization_decision; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.authorization_decision (
    id text NOT NULL,
    "traceId" text NOT NULL,
    "userId" text,
    "identityId" text,
    "tenantId" text,
    "organizationId" text,
    "siteId" text,
    "applicationId" text,
    environment business_manager."IamEnvironment",
    resource text NOT NULL,
    action text NOT NULL,
    result business_manager."AuthorizationResult" NOT NULL,
    "matchedRoleIds" jsonb,
    "matchedPermissionIds" jsonb,
    "matchedPolicyIds" jsonb,
    reason jsonb,
    "riskLevel" business_manager."RiskLevel",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: billing_account; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_account (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "customerName" text NOT NULL,
    "billingEmail" text NOT NULL,
    "billingAddress" jsonb,
    "taxInformation" jsonb,
    currency character varying(3) DEFAULT 'MGA'::character varying NOT NULL,
    status business_manager."BillingAccountStatus" DEFAULT 'ACTIVE'::business_manager."BillingAccountStatus" NOT NULL,
    "legalName" text,
    "billingContact" text,
    "taxIdentifier" text,
    "invoiceLanguage" text DEFAULT 'fr'::text NOT NULL,
    "paymentTerms" integer,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text
);


--
-- Name: billing_adjustment; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_adjustment (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "invoiceId" text,
    type business_manager."AdjustmentType" NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency character varying(3) DEFAULT 'MGA'::character varying NOT NULL,
    reason text NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: billing_credit; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_credit (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "billingAccountId" text,
    "invoiceId" text,
    amount numeric(18,2) NOT NULL,
    "remainingAmount" numeric(18,2) NOT NULL,
    currency character varying(3) DEFAULT 'MGA'::character varying NOT NULL,
    reason text NOT NULL,
    source text NOT NULL,
    status business_manager."CreditStatus" DEFAULT 'AVAILABLE'::business_manager."CreditStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


--
-- Name: billing_diagnostic; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_diagnostic (
    id text NOT NULL,
    stage business_manager."BillingStage" NOT NULL,
    status business_manager."BillingDiagnosticStatus" DEFAULT 'UNKNOWN'::business_manager."BillingDiagnosticStatus" NOT NULL,
    code text,
    message text,
    resource text,
    "correlationId" text,
    "traceId" text,
    "tenantId" text,
    details jsonb,
    "checkedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: billing_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_event (
    id text NOT NULL,
    "traceId" text,
    "tenantId" text NOT NULL,
    "subscriptionId" text,
    "invoiceId" text,
    "paymentId" text,
    "eventType" text NOT NULL,
    payload jsonb,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: billing_price; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_price (
    id text NOT NULL,
    "planId" text NOT NULL,
    currency character varying(3) NOT NULL,
    amount numeric(18,2) NOT NULL,
    "interval" business_manager."BillingInterval" NOT NULL,
    "intervalCount" integer DEFAULT 1 NOT NULL,
    "pricingModel" business_manager."PricingModel" DEFAULT 'FLAT'::business_manager."PricingModel" NOT NULL,
    "effectiveFrom" timestamp(3) without time zone NOT NULL,
    "effectiveUntil" timestamp(3) without time zone,
    status business_manager."PriceStatus" DEFAULT 'ACTIVE'::business_manager."PriceStatus" NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: billing_product; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_product (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    features jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone
);


--
-- Name: billing_webhook_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.billing_webhook_event (
    id text NOT NULL,
    provider text NOT NULL,
    "providerEventId" text NOT NULL,
    "signatureValid" boolean NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "processedAt" timestamp(3) without time zone,
    payload jsonb NOT NULL,
    "receivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bm_capability_dependencies; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_capability_dependencies (
    id uuid NOT NULL,
    "capabilityId" uuid NOT NULL,
    "targetCapabilityCode" character varying(100) NOT NULL,
    "dependencyType" business_manager."BmDependencyType" NOT NULL,
    configuration jsonb,
    "tenantId" uuid
);


--
-- Name: bm_computed_fields; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_computed_fields (
    id uuid NOT NULL,
    "entityId" uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    expression text,
    "targetFieldCode" text,
    description text,
    configuration jsonb,
    version character varying(50),
    "tenantId" uuid
);


--
-- Name: bm_constraints; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_constraints (
    id uuid NOT NULL,
    "entityId" uuid NOT NULL,
    "fieldId" uuid,
    code character varying(100) NOT NULL,
    "constraintType" business_manager."BmConstraintType" DEFAULT 'UNIQUE'::business_manager."BmConstraintType" NOT NULL,
    name character varying(255),
    definition jsonb,
    version character varying(50),
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_contract_versions; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_contract_versions (
    id uuid NOT NULL,
    "contractId" uuid NOT NULL,
    "versionNumber" character varying(50) NOT NULL,
    content jsonb,
    hash character varying(255),
    compatibility character varying(50),
    status business_manager."BmContractStatus" DEFAULT 'DRAFT'::business_manager."BmContractStatus" NOT NULL,
    "tenantId" uuid
);


--
-- Name: bm_contracts; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_contracts (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    status business_manager."BmContractStatus" DEFAULT 'DRAFT'::business_manager."BmContractStatus" NOT NULL,
    "contractHash" character varying(255),
    manifest jsonb,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_entities; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_entities (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    "pluralName" character varying(255),
    description text,
    icon character varying(50),
    status business_manager."BmEntityStatus" DEFAULT 'DRAFT'::business_manager."BmEntityStatus" NOT NULL,
    scope business_manager."BmDataScope",
    classification business_manager."BmDataClassification",
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_feature_capabilities; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_feature_capabilities (
    id uuid NOT NULL,
    "featureId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    required boolean DEFAULT false NOT NULL,
    status business_manager."BmCapabilityStatus" DEFAULT 'DRAFT'::business_manager."BmCapabilityStatus" NOT NULL,
    "requiredEntities" text[],
    configuration jsonb,
    version character varying(50),
    "tenantId" uuid
);


--
-- Name: bm_features; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_features (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    tags text[],
    status business_manager."BmFeatureStatus" DEFAULT 'DRAFT'::business_manager."BmFeatureStatus" NOT NULL,
    source character varying(50),
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_field_validations; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_field_validations (
    id uuid NOT NULL,
    "fieldId" uuid NOT NULL,
    "validationType" business_manager."BmValidationType" NOT NULL,
    value text,
    message text,
    configuration jsonb,
    version character varying(50),
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_fields; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_fields (
    id uuid NOT NULL,
    "entityId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    label character varying(255),
    description text,
    type business_manager."BmDataTypeCode" NOT NULL,
    required boolean DEFAULT false NOT NULL,
    "unique" boolean DEFAULT false NOT NULL,
    readonly boolean DEFAULT false NOT NULL,
    indexed boolean DEFAULT false NOT NULL,
    "defaultValue" text,
    "position" integer DEFAULT 0 NOT NULL,
    scope business_manager."BmDataScope",
    classification business_manager."BmDataClassification",
    configuration jsonb,
    version character varying(50),
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_index_fields; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_index_fields (
    id uuid NOT NULL,
    "indexId" uuid NOT NULL,
    "fieldId" uuid NOT NULL,
    sort character varying(10) DEFAULT 'ASC'::character varying NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: bm_indexes; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_indexes (
    id uuid NOT NULL,
    "entityId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255),
    "indexType" business_manager."BmIndexType" DEFAULT 'SIMPLE'::business_manager."BmIndexType" NOT NULL,
    "unique" boolean DEFAULT false NOT NULL,
    definition jsonb,
    version character varying(50),
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_menus; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_menus (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    location business_manager."BmMenuLocation" DEFAULT 'SIDEBAR'::business_manager."BmMenuLocation" NOT NULL,
    status business_manager."BmNavigationStatus" DEFAULT 'DRAFT'::business_manager."BmNavigationStatus" NOT NULL,
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_navigation_items; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_navigation_items (
    id uuid NOT NULL,
    "menuId" uuid NOT NULL,
    "parentItemId" uuid,
    code character varying(100) NOT NULL,
    label character varying(255),
    "itemType" business_manager."BmMenuItemType" DEFAULT 'LINK'::business_manager."BmMenuItemType" NOT NULL,
    "routePath" text,
    icon character varying(50),
    "requiredCapabilities" text[],
    "capabilityOperator" character varying(10) DEFAULT 'ANY'::character varying NOT NULL,
    visibility business_manager."BmNavigationVisibility" DEFAULT 'VISIBLE'::business_manager."BmNavigationVisibility" NOT NULL,
    "orderIndex" integer DEFAULT 0 NOT NULL,
    configuration jsonb,
    version character varying(50),
    "tenantId" uuid
);


--
-- Name: bm_quality_gates; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_quality_gates (
    id uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "blockOnFailure" boolean DEFAULT true NOT NULL,
    rules jsonb,
    result business_manager."BmqGateResult",
    "tenantId" uuid
);


--
-- Name: bm_quality_issues; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_quality_issues (
    id uuid NOT NULL,
    "reportId" uuid,
    "runId" uuid,
    "ruleCode" character varying(100),
    severity business_manager."BmqSeverity" NOT NULL,
    code character varying(100) NOT NULL,
    message text NOT NULL,
    details jsonb,
    source character varying(100),
    waived boolean DEFAULT false NOT NULL,
    "waiverReason" text,
    "tenantId" uuid
);


--
-- Name: bm_quality_metrics; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_quality_metrics (
    id uuid NOT NULL,
    "reportId" uuid,
    key character varying(100) NOT NULL,
    label character varying(255),
    value text,
    "numericValue" double precision,
    unit character varying(50),
    "tenantId" uuid
);


--
-- Name: bm_quality_reports; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_quality_reports (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    scope character varying(50),
    status business_manager."BmqStatus" DEFAULT 'PENDING'::business_manager."BmqStatus" NOT NULL,
    score double precision,
    "gateResult" business_manager."BmqGateResult",
    "triggeredBy" character varying(100),
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "inputHash" text
);


--
-- Name: bm_relations; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_relations (
    id uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    "sourceEntityId" uuid NOT NULL,
    "targetEntityId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    "relationType" business_manager."BmRelationType" DEFAULT 'ONE_TO_MANY'::business_manager."BmRelationType" NOT NULL,
    "sourceLabel" text,
    "targetLabel" text,
    required boolean DEFAULT false NOT NULL,
    "deleteBehavior" business_manager."BmDeleteBehavior" DEFAULT 'RESTRICT'::business_manager."BmDeleteBehavior" NOT NULL,
    configuration jsonb,
    version character varying(50),
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_runtime_bindings; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_runtime_bindings (
    id uuid NOT NULL,
    "manifestId" uuid NOT NULL,
    "targetType" character varying(50) NOT NULL,
    "targetId" character varying(255) NOT NULL,
    configuration jsonb,
    status business_manager."BmRuntimeReadiness" DEFAULT 'NOT_READY'::business_manager."BmRuntimeReadiness" NOT NULL,
    "tenantId" uuid
);


--
-- Name: bm_runtime_manifests; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_runtime_manifests (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    status business_manager."BmNavigationStatus" DEFAULT 'DRAFT'::business_manager."BmNavigationStatus" NOT NULL,
    manifest jsonb,
    hash character varying(255),
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: bm_test_cases; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_test_cases (
    id uuid NOT NULL,
    "suiteId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status business_manager."BmqStatus" DEFAULT 'PENDING'::business_manager."BmqStatus" NOT NULL,
    "expectedResult" jsonb,
    "actualResult" jsonb,
    "durationMs" integer,
    "tenantId" uuid
);


--
-- Name: bm_test_runs; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_test_runs (
    id uuid NOT NULL,
    "testCaseId" uuid NOT NULL,
    status business_manager."BmqStatus" DEFAULT 'PENDING'::business_manager."BmqStatus" NOT NULL,
    result jsonb,
    "durationMs" integer,
    "executedAt" timestamp(3) without time zone,
    "tenantId" uuid
);


--
-- Name: bm_test_suites; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_test_suites (
    id uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status business_manager."BmqStatus" DEFAULT 'PENDING'::business_manager."BmqStatus" NOT NULL,
    "tenantId" uuid
);


--
-- Name: bm_validation_campaigns; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_validation_campaigns (
    id uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "profileCode" character varying(100),
    status business_manager."BmqStatus" DEFAULT 'PENDING'::business_manager."BmqStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    trigger character varying(50),
    "tenantId" uuid
);


--
-- Name: bm_validation_runs; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_validation_runs (
    id uuid NOT NULL,
    "campaignId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    status business_manager."BmqStatus" DEFAULT 'PENDING'::business_manager."BmqStatus" NOT NULL,
    "validatorCode" character varying(100),
    result jsonb,
    "durationMs" integer,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "tenantId" uuid
);


--
-- Name: bm_version_capabilities; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_version_capabilities (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    "featureCode" character varying(100) NOT NULL,
    "capabilityCode" character varying(100) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    required boolean DEFAULT false NOT NULL,
    "tenantId" uuid
);


--
-- Name: bm_version_features; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.bm_version_features (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    "featureCode" character varying(100) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "activationStrategy" character varying(50),
    configuration jsonb,
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    "tenantId" uuid
);


--
-- Name: configuration_history; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.configuration_history (
    id uuid NOT NULL,
    "configurationId" uuid NOT NULL,
    action business_manager."ConfigurationHistoryAction" NOT NULL,
    actor character varying(100),
    changes jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" character varying(100)
);


--
-- Name: configurations; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.configurations (
    id uuid NOT NULL,
    key character varying(150) NOT NULL,
    scope business_manager."ConfigurationScope" NOT NULL,
    "scopeId" character varying(100),
    type business_manager."ConfigurationType" NOT NULL,
    value jsonb,
    "defaultValue" jsonb,
    required boolean DEFAULT false NOT NULL,
    schema jsonb,
    version character varying(50) DEFAULT '1.0.0'::character varying NOT NULL,
    status business_manager."ConfigurationStatus" DEFAULT 'DRAFT'::business_manager."ConfigurationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: connectors; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.connectors (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    "providerType" business_manager."ConnectorProviderType" NOT NULL,
    "contractVersion" character varying(50),
    status business_manager."ConnectorStatus" DEFAULT 'DRAFT'::business_manager."ConnectorStatus" NOT NULL,
    "configurationSchema" jsonb,
    "credentialRef" character varying(255),
    capabilities jsonb,
    health business_manager."ConnectorHealthStatus" DEFAULT 'UNKNOWN'::business_manager."ConnectorHealthStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: context_invalidation; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.context_invalidation (
    id text NOT NULL,
    "subjectType" text NOT NULL,
    "subjectId" text NOT NULL,
    "tenantId" text,
    reason text NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    "sourceEventType" text,
    "sourceEventId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone
);


--
-- Name: context_snapshot; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.context_snapshot (
    id text NOT NULL,
    "traceId" text,
    "userId" text NOT NULL,
    "identityId" text,
    "tenantId" text,
    "organizationId" text,
    "siteId" text,
    "applicationId" text,
    environment business_manager."IamEnvironment",
    "sessionId" text,
    roles jsonb NOT NULL,
    permissions jsonb NOT NULL,
    policies jsonb,
    authentication jsonb NOT NULL,
    security jsonb NOT NULL,
    "subscriptionContext" jsonb,
    "entitlementContext" jsonb,
    "sourceRevision" text,
    "resolvedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


--
-- Name: context_switch_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.context_switch_event (
    id text NOT NULL,
    "traceId" text,
    "userId" text NOT NULL,
    "sessionId" text,
    "fromTenantId" text,
    "fromOrganizationId" text,
    "fromSiteId" text,
    "toTenantId" text,
    "toOrganizationId" text,
    "toSiteId" text,
    "previousContextId" text,
    "resolvedContextId" text,
    result text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contract_consumers; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.contract_consumers (
    id uuid NOT NULL,
    "contractId" uuid NOT NULL,
    "consumerCode" character varying(100) NOT NULL,
    "consumerType" business_manager."ContractParticipantType" NOT NULL,
    "supportedVersion" character varying(50),
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contract_history; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.contract_history (
    id uuid NOT NULL,
    "contractId" uuid NOT NULL,
    action business_manager."ContractHistoryAction" NOT NULL,
    actor character varying(100),
    changes jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" character varying(100)
);


--
-- Name: contract_providers; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.contract_providers (
    id uuid NOT NULL,
    "contractId" uuid NOT NULL,
    "providerCode" character varying(100) NOT NULL,
    "providerType" business_manager."ContractParticipantType" NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contracts; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.contracts (
    id uuid NOT NULL,
    "contractCode" character varying(100) NOT NULL,
    "contractVersion" character varying(50) NOT NULL,
    "ownerTeam" character varying(100) NOT NULL,
    status business_manager."ContractStatus" DEFAULT 'DRAFT'::business_manager."ContractStatus" NOT NULL,
    schema jsonb NOT NULL,
    "compatibilityPolicy" jsonb NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deprecatedAt" timestamp(3) without time zone,
    hash character varying(128),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: credential_references; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.credential_references (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    type business_manager."CredentialType" NOT NULL,
    provider character varying(100) NOT NULL,
    status business_manager."CredentialStatus" DEFAULT 'ACTIVE'::business_manager."CredentialStatus" NOT NULL,
    "lastRotatedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "metadataSafe" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: deployment_gates; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.deployment_gates (
    id uuid NOT NULL,
    "deploymentId" uuid NOT NULL,
    type business_manager."DeploymentGateType" NOT NULL,
    name character varying(150) NOT NULL,
    result business_manager."DeploymentGateResult" DEFAULT 'NOT_APPLICABLE'::business_manager."DeploymentGateResult" NOT NULL,
    required boolean DEFAULT true NOT NULL,
    message text,
    "executedBy" character varying(100),
    "executedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: deployment_history; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.deployment_history (
    id uuid NOT NULL,
    "traceId" character varying(100) NOT NULL,
    "releaseId" uuid,
    "deploymentId" uuid,
    "applicationId" uuid,
    "environmentId" uuid,
    action business_manager."DeploymentHistoryAction" NOT NULL,
    status character varying(50) NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "finishedAt" timestamp(3) without time zone,
    duration integer,
    actor character varying(100),
    "errorCode" character varying(100),
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" character varying(100)
);


--
-- Name: deployments; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.deployments (
    id uuid NOT NULL,
    "releaseId" uuid NOT NULL,
    "environmentId" uuid NOT NULL,
    status business_manager."DeploymentStatus" DEFAULT 'PENDING'::business_manager."DeploymentStatus" NOT NULL,
    strategy business_manager."DeploymentStrategy" DEFAULT 'STANDARD'::business_manager."DeploymentStrategy" NOT NULL,
    "idempotencyKey" character varying(150),
    "startedBy" character varying(100) NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "healthStatus" character varying(50),
    "traceId" character varying(100),
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: entity_mapping; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.entity_mapping (
    id text NOT NULL,
    "tenantId" character varying(100) NOT NULL,
    erp_id text NOT NULL,
    entity text NOT NULL,
    erp_entity text NOT NULL,
    field_mappings jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    version text DEFAULT '1.0'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: environment_deployments; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.environment_deployments (
    id uuid NOT NULL,
    "environmentId" uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "currentReleaseId" uuid,
    "previousReleaseId" uuid,
    "deploymentId" uuid,
    "deployedAt" timestamp(3) without time zone,
    "healthStatus" character varying(50),
    status business_manager."EnvironmentDeploymentStatus" DEFAULT 'ACTIVE'::business_manager."EnvironmentDeploymentStatus" NOT NULL,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: environment_history; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.environment_history (
    id uuid NOT NULL,
    "environmentId" uuid NOT NULL,
    action business_manager."EnvironmentHistoryAction" NOT NULL,
    actor character varying(100),
    changes jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" character varying(100)
);


--
-- Name: environments; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.environments (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    type business_manager."EnvironmentType" NOT NULL,
    status business_manager."EnvironmentStatus" DEFAULT 'ACTIVE'::business_manager."EnvironmentStatus" NOT NULL,
    region character varying(100),
    "baseUrl" character varying(500),
    "configurationRef" character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: erp_registry; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.erp_registry (
    id text NOT NULL,
    "tenantId" character varying(100) NOT NULL,
    code text NOT NULL,
    nom text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    status text DEFAULT 'inactive'::text NOT NULL,
    capabilities jsonb,
    health_status text DEFAULT 'unknown'::text NOT NULL,
    last_connection timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: external_identity_link; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.external_identity_link (
    id text NOT NULL,
    "identityId" text NOT NULL,
    "providerType" text NOT NULL,
    "providerInstanceId" text NOT NULL,
    "externalSubjectId" text NOT NULL,
    "externalEntityType" text,
    confidence double precision,
    verified boolean DEFAULT false NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "lastSyncAt" timestamp(3) without time zone,
    "disabledAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: feature; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.feature (
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    metered boolean DEFAULT false NOT NULL,
    "quotaCode" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    kind business_manager."EntitlementKind" DEFAULT 'BOOLEAN'::business_manager."EntitlementKind" NOT NULL,
    unit text,
    "meterKey" text,
    enforcement business_manager."EnforcementPolicy" DEFAULT 'SOFT_LIMIT'::business_manager."EnforcementPolicy" NOT NULL
);


--
-- Name: group_member; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.group_member (
    id text NOT NULL,
    "groupId" text NOT NULL,
    "userId" text NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "removedAt" timestamp(3) without time zone,
    "removedBy" text
);


--
-- Name: groups; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.groups (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "organizationId" text,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    type business_manager."GroupType" DEFAULT 'STATIC'::business_manager."GroupType" NOT NULL,
    "dynamicRule" jsonb,
    active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: iam_credential; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.iam_credential (
    id text NOT NULL,
    "userId" text NOT NULL,
    type business_manager."IamCredentialType" NOT NULL,
    status business_manager."IamCredentialStatus" DEFAULT 'ACTIVE'::business_manager."IamCredentialStatus" NOT NULL,
    "secretHash" text,
    "secretRef" text,
    identifier text,
    "expiresAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text,
    "revokeReason" text,
    "lastUsedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: iam_device; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.iam_device (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fingerprintHash" text,
    name text,
    "deviceType" text,
    "trustLevel" business_manager."DeviceTrustLevel" DEFAULT 'UNKNOWN'::business_manager."DeviceTrustLevel" NOT NULL,
    "firstSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "trustedAt" timestamp(3) without time zone,
    "trustedBy" text,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text,
    "revokeReason" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: iam_password_history; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.iam_password_history (
    id text NOT NULL,
    "userId" text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: iam_refresh_token; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.iam_refresh_token (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "familyId" text NOT NULL,
    status business_manager."TokenStatus" DEFAULT 'ACTIVE'::business_manager."TokenStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "rotatedAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "revokeReason" text,
    "replacedByTokenId" text
);


--
-- Name: iam_session; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.iam_session (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text,
    "organizationId" text,
    "siteId" text,
    "applicationId" text,
    environment business_manager."IamEnvironment",
    "deviceId" text,
    status business_manager."SessionStatus" DEFAULT 'ACTIVE'::business_manager."SessionStatus" NOT NULL,
    "authenticationLevel" text,
    "riskLevel" business_manager."RiskLevel" DEFAULT 'LOW'::business_manager."RiskLevel" NOT NULL,
    "ipHash" text,
    "userAgentHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastActivityAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "idleExpiresAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text,
    "revokeReason" text,
    "statusChangedAt" timestamp(3) without time zone,
    metadata jsonb
);


--
-- Name: iam_user; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.iam_user (
    id text NOT NULL,
    username text NOT NULL,
    "primaryEmail" text NOT NULL,
    phone text,
    "firstName" text,
    "lastName" text,
    "displayName" text,
    "avatarRef" text,
    locale text,
    timezone text,
    status business_manager."UserStatus" DEFAULT 'PENDING'::business_manager."UserStatus" NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "defaultTenantId" text,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "passwordResetToken" text,
    "passwordResetExpiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: identity; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.identity (
    id text NOT NULL,
    type business_manager."IdentityType" NOT NULL,
    status business_manager."IdentityStatus" DEFAULT 'PENDING'::business_manager."IdentityStatus" NOT NULL,
    provider text,
    subject text,
    email text,
    phone text,
    confidence double precision,
    "verifiedAt" timestamp(3) without time zone,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: integration_logs; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.integration_logs (
    id uuid NOT NULL,
    "traceId" character varying(100) NOT NULL,
    "tenantId" character varying(100),
    "connectorId" uuid,
    operation character varying(255) NOT NULL,
    direction business_manager."IntegrationLogDirection" NOT NULL,
    "startedAt" timestamp(3) without time zone NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    duration integer,
    status business_manager."IntegrationLogStatus" NOT NULL,
    "errorCode" character varying(100),
    attempt integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoice; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.invoice (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "subscriptionId" text,
    "invoiceNumber" text NOT NULL,
    status business_manager."InvoiceStatus" DEFAULT 'DRAFT'::business_manager."InvoiceStatus" NOT NULL,
    currency character varying(3) DEFAULT 'MGA'::character varying NOT NULL,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    "taxTotal" numeric(18,2) DEFAULT 0 NOT NULL,
    "discountTotal" numeric(18,2) DEFAULT 0 NOT NULL,
    total numeric(18,2) DEFAULT 0 NOT NULL,
    "amountPaid" numeric(18,2) DEFAULT 0 NOT NULL,
    "amountDue" numeric(18,2) DEFAULT 0 NOT NULL,
    "issuedAt" timestamp(3) without time zone,
    "dueAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "billingAccountId" text,
    "creditApplied" numeric(18,2) DEFAULT 0 NOT NULL,
    "periodStart" timestamp(3) without time zone,
    "periodEnd" timestamp(3) without time zone,
    "voidedAt" timestamp(3) without time zone,
    "voidReason" text,
    "createdBy" text
);


--
-- Name: invoice_item; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.invoice_item (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    code text,
    description text NOT NULL,
    quantity numeric(18,4) DEFAULT 1 NOT NULL,
    "unitPrice" numeric(18,2) NOT NULL,
    subtotal numeric(18,2) NOT NULL,
    "taxAmount" numeric(18,2) DEFAULT 0 NOT NULL,
    total numeric(18,2) NOT NULL,
    metadata jsonb,
    "priceId" text,
    discount numeric(18,2) DEFAULT 0 NOT NULL,
    "sourceType" text,
    "sourceRef" text,
    "periodStart" timestamp(3) without time zone,
    "periodEnd" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: membership; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.membership (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text NOT NULL,
    "organizationId" text,
    "siteId" text,
    status business_manager."MembershipStatus" DEFAULT 'INVITED'::business_manager."MembershipStatus" NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "joinedAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text,
    "revokeReason" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: meter; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.meter (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    aggregation business_manager."MeterAggregation" DEFAULT 'SUM'::business_manager."MeterAggregation" NOT NULL,
    period business_manager."MeterPeriod" DEFAULT 'BILLING_PERIOD'::business_manager."MeterPeriod" NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "entitlementCode" text,
    description text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: mfa_method; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.mfa_method (
    id text NOT NULL,
    "userId" text NOT NULL,
    type business_manager."MfaType" NOT NULL,
    label text,
    "secretRef" text,
    enabled boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "lastUsedAt" timestamp(3) without time zone,
    "disabledAt" timestamp(3) without time zone,
    metadata jsonb
);


--
-- Name: organization; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.organization (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."OrganizationStatus" DEFAULT 'ACTIVE'::business_manager."OrganizationStatus" NOT NULL,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: outbox_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.outbox_event (
    id text NOT NULL,
    "aggregateType" text NOT NULL,
    "aggregateId" text NOT NULL,
    "eventType" text NOT NULL,
    payload jsonb NOT NULL,
    "traceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "lastError" text
);


--
-- Name: payment; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.payment (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    status business_manager."PaymentStatus" DEFAULT 'PENDING'::business_manager."PaymentStatus" NOT NULL,
    provider text,
    "externalReference" text,
    amount numeric(18,2) NOT NULL,
    currency character varying(3) DEFAULT 'MGA'::character varying NOT NULL,
    "initiatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "refundedAt" timestamp(3) without time zone,
    "failureCode" text,
    "failureMessage" text,
    metadata jsonb,
    method business_manager."PaymentMethod" DEFAULT 'MANUAL'::business_manager."PaymentMethod" NOT NULL,
    "tenantId" text NOT NULL,
    "idempotencyKey" text,
    "proofReference" text,
    notes text,
    "validatedBy" text,
    "validatedAt" timestamp(3) without time zone,
    "refundAmount" numeric(18,2),
    "refundReason" text
);


--
-- Name: payment_attempt; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.payment_attempt (
    id text NOT NULL,
    "attemptId" text NOT NULL,
    "paymentId" text NOT NULL,
    provider text,
    "providerReference" text,
    status business_manager."PaymentStatus" DEFAULT 'PENDING'::business_manager."PaymentStatus" NOT NULL,
    "errorCode" text,
    "correlationId" text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


--
-- Name: permission; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.permission (
    id text NOT NULL,
    code text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    name text NOT NULL,
    description text,
    critical boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text
);


--
-- Name: plan; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.plan (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."PlanStatus" DEFAULT 'DRAFT'::business_manager."PlanStatus" NOT NULL,
    "billingInterval" business_manager."BillingInterval" DEFAULT 'MONTHLY'::business_manager."BillingInterval" NOT NULL,
    "trialDays" integer,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL,
    "billingModel" business_manager."PricingModel" DEFAULT 'FLAT'::business_manager."PricingModel" NOT NULL,
    "intervalCount" integer DEFAULT 1 NOT NULL,
    "productId" text
);


--
-- Name: plan_entitlement; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.plan_entitlement (
    id text NOT NULL,
    "planId" text NOT NULL,
    "featureCode" text NOT NULL,
    "valueType" business_manager."EntitlementValueType" DEFAULT 'BOOLEAN'::business_manager."EntitlementValueType" NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "integerValue" integer,
    "decimalValue" numeric(18,4),
    "stringValue" text,
    "jsonValue" jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    kind business_manager."EntitlementKind" DEFAULT 'BOOLEAN'::business_manager."EntitlementKind" NOT NULL,
    unit text,
    enforcement business_manager."EnforcementPolicy" DEFAULT 'SOFT_LIMIT'::business_manager."EnforcementPolicy" NOT NULL,
    "meterKey" text
);


--
-- Name: platform_diagnostic; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.platform_diagnostic (
    id text NOT NULL,
    "serviceId" text,
    component text NOT NULL,
    status business_manager."DiagnosticStatus" DEFAULT 'UNKNOWN'::business_manager."DiagnosticStatus" NOT NULL,
    severity business_manager."SecuritySeverity",
    message text,
    details jsonb,
    "traceId" text,
    "checkedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


--
-- Name: platform_maintenance; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.platform_maintenance (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    component text,
    environment business_manager."IamEnvironment",
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone,
    active boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    metadata jsonb
);


--
-- Name: platform_service; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.platform_service (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."PlatformServiceStatus" DEFAULT 'STARTING'::business_manager."PlatformServiceStatus" NOT NULL,
    version text,
    "baseUrl" text,
    environment business_manager."IamEnvironment",
    metadata jsonb,
    "lastHealthCheckAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: pm_capabilities; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_capabilities (
    id uuid NOT NULL,
    "tenantId" uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "capabilityType" text DEFAULT 'BUSINESS'::text NOT NULL,
    scope text DEFAULT 'TENANT'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "contractRef" text,
    "contractVersion" text,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL
);


--
-- Name: pm_dependencies; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_dependencies (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    "sourceType" text NOT NULL,
    "sourceId" text NOT NULL,
    "dependencyType" text DEFAULT 'REQUIRES'::text NOT NULL,
    "targetType" text NOT NULL,
    "targetRef" text NOT NULL,
    "targetVersionRange" text,
    required boolean DEFAULT true NOT NULL,
    "conditionRef" text,
    reason text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "resolutionStatus" text DEFAULT 'NOT_RESOLVED'::text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(6) with time zone,
    "rowVersion" integer DEFAULT 1 NOT NULL
);


--
-- Name: pm_feature_capabilities; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_feature_capabilities (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "featureId" uuid NOT NULL,
    "capabilityId" uuid NOT NULL,
    "relationType" text DEFAULT 'REQUIRES'::text NOT NULL,
    required boolean DEFAULT true NOT NULL,
    configuration jsonb
);


--
-- Name: pm_manifests; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_manifests (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    "contractVersion" text DEFAULT '1.0.0'::text NOT NULL,
    "manifestHash" text NOT NULL,
    status text DEFAULT 'GENERATED'::text NOT NULL,
    content jsonb NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "publishedAt" timestamp(6) with time zone
);


--
-- Name: pm_pack_features; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_pack_features (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    "moduleId" uuid,
    code text NOT NULL,
    name text NOT NULL,
    "shortName" text,
    description text,
    "featureType" text DEFAULT 'BUSINESS'::text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "defaultEnabled" boolean DEFAULT true NOT NULL,
    visibility text DEFAULT 'VISIBLE'::text NOT NULL,
    configuration jsonb,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(6) with time zone,
    "rowVersion" integer DEFAULT 1 NOT NULL
);


--
-- Name: pm_pack_modules; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_pack_modules (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "shortName" text,
    description text,
    "moduleType" text DEFAULT 'BUSINESS'::text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "iconKey" text,
    configuration jsonb,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(6) with time zone,
    "rowVersion" integer DEFAULT 1 NOT NULL
);


--
-- Name: pm_pack_versions; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_pack_versions (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packId" uuid NOT NULL,
    "versionNumber" text NOT NULL,
    label text,
    description text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "validationStatus" text DEFAULT 'NOT_RUN'::text NOT NULL,
    "manifestStatus" text DEFAULT 'NOT_GENERATED'::text NOT NULL,
    "changeType" text DEFAULT 'INITIAL'::text NOT NULL,
    "sourceVersionId" uuid,
    "releaseNotes" text,
    "snapshotHash" text,
    "manifestHash" text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "updatedBy" text,
    "validatedAt" timestamp(6) with time zone,
    "validatedBy" text,
    "publishedAt" timestamp(6) with time zone,
    "publishedBy" text,
    "deprecatedAt" timestamp(6) with time zone,
    "archivedAt" timestamp(6) with time zone,
    "rowVersion" integer DEFAULT 1 NOT NULL
);


--
-- Name: pm_packs; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_packs (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "shortName" text,
    description text,
    "categoryId" text,
    "iconKey" text,
    "logoRef" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "sourceType" text DEFAULT 'CUSTOM'::text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(6) with time zone,
    "rowVersion" integer DEFAULT 1 NOT NULL
);


--
-- Name: pm_rules; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_rules (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "ruleType" text DEFAULT 'ACTIVATION'::text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    effect text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "expressionVersion" text DEFAULT '1.0'::text NOT NULL,
    expression jsonb NOT NULL,
    "ruleHash" text,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(6) with time zone,
    "rowVersion" integer DEFAULT 1 NOT NULL
);


--
-- Name: pm_snapshots; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_snapshots (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    "snapshotHash" text NOT NULL,
    content jsonb NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pm_validations; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pm_validations (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    status text NOT NULL,
    issues jsonb NOT NULL,
    summary jsonb NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL
);


--
-- Name: policy_condition; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.policy_condition (
    id text NOT NULL,
    "policyId" text NOT NULL,
    attribute text NOT NULL,
    operator text NOT NULL,
    value jsonb,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    metadata jsonb
);


--
-- Name: pr_effective_manifests; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pr_effective_manifests (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "resolutionId" uuid NOT NULL,
    "applicationId" text NOT NULL,
    environment text NOT NULL,
    "manifestHash" text NOT NULL,
    "functionalHash" text NOT NULL,
    "contractVersion" text DEFAULT '1.0.0'::text NOT NULL,
    status text NOT NULL,
    executable boolean NOT NULL,
    content jsonb NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pr_runtime_diagnostics; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pr_runtime_diagnostics (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "resolutionId" uuid,
    severity text NOT NULL,
    category text NOT NULL,
    code text NOT NULL,
    message text NOT NULL,
    details jsonb,
    "traceId" text NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pr_runtime_resolution_steps; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pr_runtime_resolution_steps (
    id uuid NOT NULL,
    "resolutionId" uuid NOT NULL,
    code text NOT NULL,
    status text NOT NULL,
    "displayOrder" integer NOT NULL,
    "inputHash" text,
    "outputHash" text,
    details jsonb,
    "startedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(6) with time zone
);


--
-- Name: pr_runtime_resolutions; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.pr_runtime_resolutions (
    id uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "applicationId" text NOT NULL,
    environment text NOT NULL,
    "packId" uuid NOT NULL,
    "packVersionId" uuid NOT NULL,
    "requestHash" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    context jsonb NOT NULL,
    result jsonb,
    diagnostics jsonb,
    "startedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(6) with time zone,
    "createdBy" text NOT NULL
);


--
-- Name: quota_usage; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.quota_usage (
    id text NOT NULL,
    "subscriptionId" text NOT NULL,
    "featureCode" text NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "usedValue" numeric(18,4) DEFAULT 0 NOT NULL,
    "limitValue" numeric(18,4),
    "updatedAt" timestamp(3) without time zone NOT NULL,
    unit text,
    enforcement business_manager."EnforcementPolicy" DEFAULT 'SOFT_LIMIT'::business_manager."EnforcementPolicy" NOT NULL
);


--
-- Name: recovery_code; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.recovery_code (
    id text NOT NULL,
    "userId" text NOT NULL,
    "codeHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "usedAt" timestamp(3) without time zone
);


--
-- Name: releases; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.releases (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    version character varying(50) NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    "snapshotId" uuid NOT NULL,
    "artifactRefs" jsonb NOT NULL,
    "contractVersions" jsonb NOT NULL,
    "configurationVersion" character varying(50) NOT NULL,
    status business_manager."ReleaseStatus" DEFAULT 'DRAFT'::business_manager."ReleaseStatus" NOT NULL,
    "createdBy" character varying(100) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "releasedAt" timestamp(3) without time zone,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: role; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.role (
    id text NOT NULL,
    "tenantId" text,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."RoleStatus" DEFAULT 'ACTIVE'::business_manager."RoleStatus" NOT NULL,
    system boolean DEFAULT false NOT NULL,
    privileged boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: role_assignment; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.role_assignment (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "userId" text,
    "groupId" text,
    "serviceAccountId" text,
    "tenantId" text,
    "organizationId" text,
    "siteId" text,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    temporary boolean DEFAULT false NOT NULL,
    delegated boolean DEFAULT false NOT NULL,
    "assignedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text,
    "revokeReason" text
);


--
-- Name: role_permission; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.role_permission (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "grantedBy" text,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text
);


--
-- Name: rollbacks; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.rollbacks (
    id uuid NOT NULL,
    "deploymentId" uuid NOT NULL,
    "fromReleaseId" uuid NOT NULL,
    "toReleaseId" uuid NOT NULL,
    type business_manager."RollbackType" NOT NULL,
    reason text NOT NULL,
    status business_manager."RollbackStatus" DEFAULT 'PENDING'::business_manager."RollbackStatus" NOT NULL,
    "startedBy" character varying(100) NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "traceId" character varying(100),
    metadata jsonb
);


--
-- Name: security_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.security_event (
    id text NOT NULL,
    "traceId" text,
    type text NOT NULL,
    severity business_manager."SecuritySeverity" NOT NULL,
    "userId" text,
    "identityId" text,
    "tenantId" text,
    "organizationId" text,
    "siteId" text,
    "sessionId" text,
    "deviceId" text,
    "riskLevel" business_manager."RiskLevel",
    source text,
    metadata jsonb,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: service_account; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.service_account (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "identityId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."ServiceAccountStatus" DEFAULT 'ACTIVE'::business_manager."ServiceAccountStatus" NOT NULL,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: service_account_credential; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.service_account_credential (
    id text NOT NULL,
    "serviceAccountId" text NOT NULL,
    "keyId" text NOT NULL,
    "secretHash" text,
    "secretRef" text,
    status business_manager."IamCredentialStatus" DEFAULT 'ACTIVE'::business_manager."IamCredentialStatus" NOT NULL,
    scopes jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "lastUsedAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "revokedBy" text,
    "revokeReason" text
);


--
-- Name: site; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.site (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."SiteStatus" DEFAULT 'ACTIVE'::business_manager."SiteStatus" NOT NULL,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: snapshot_history; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.snapshot_history (
    id uuid NOT NULL,
    "snapshotId" uuid NOT NULL,
    action business_manager."SnapshotHistoryAction" NOT NULL,
    "createdBy" character varying(100) NOT NULL,
    "traceId" character varying(100),
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" character varying(100)
);


--
-- Name: snapshots; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.snapshots (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    "environmentId" uuid NOT NULL,
    contracts jsonb NOT NULL,
    configuration jsonb NOT NULL,
    metadata jsonb,
    "createdBy" character varying(100) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hash character varying(128) NOT NULL,
    status business_manager."SnapshotStatus" DEFAULT 'DRAFT'::business_manager."SnapshotStatus" NOT NULL,
    "tenantId" character varying(100) NOT NULL
);


--
-- Name: subscription; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.subscription (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "planId" text NOT NULL,
    "applicationCode" text,
    status business_manager."SubscriptionStatus" DEFAULT 'TRIALING'::business_manager."SubscriptionStatus" NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "trialEndsAt" timestamp(3) without time zone,
    "currentPeriodStart" timestamp(3) without time zone,
    "currentPeriodEnd" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    "suspendedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "cancellationReason" text,
    "autoRenew" boolean DEFAULT true NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    version integer DEFAULT 1 NOT NULL,
    "billingAccountId" text,
    "priceId" text,
    "nextBillingAt" timestamp(3) without time zone,
    "renewalAt" timestamp(3) without time zone,
    "graceEndsAt" timestamp(3) without time zone,
    "graceDays" integer,
    "suspendReason" text,
    "cancelAt" timestamp(3) without time zone,
    "cancelRequestedAt" timestamp(3) without time zone,
    "cancelRequestedBy" text,
    "cancellationMode" business_manager."CancellationMode",
    "endedAt" timestamp(3) without time zone
);


--
-- Name: subscription_entitlement_override; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.subscription_entitlement_override (
    id text NOT NULL,
    "subscriptionId" text NOT NULL,
    "featureCode" text NOT NULL,
    "valueType" business_manager."EntitlementValueType" DEFAULT 'BOOLEAN'::business_manager."EntitlementValueType" NOT NULL,
    enabled boolean,
    "integerValue" integer,
    "decimalValue" numeric(18,4),
    "stringValue" text,
    "jsonValue" jsonb,
    reason text,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


--
-- Name: synchronizations; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.synchronizations (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    "connectorId" uuid NOT NULL,
    source character varying(255) NOT NULL,
    target character varying(255) NOT NULL,
    direction business_manager."SynchronizationDirection" NOT NULL,
    mode business_manager."SynchronizationMode" NOT NULL,
    schedule character varying(100),
    "mappingRef" character varying(255),
    "conflictPolicy" jsonb,
    "batchSize" integer,
    status business_manager."SynchronizationStatus" DEFAULT 'PENDING'::business_manager."SynchronizationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: tenant; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.tenant (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    status business_manager."TenantStatus" DEFAULT 'PENDING'::business_manager."TenantStatus" NOT NULL,
    locale text,
    timezone text,
    metadata jsonb,
    "statusChangedAt" timestamp(3) without time zone,
    "statusChangedBy" text,
    "statusChangedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text,
    "archivedAt" timestamp(3) without time zone,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: ui_pages; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.ui_pages (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    key character varying(100) NOT NULL,
    route character varying(200) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type business_manager."UiPageType" DEFAULT 'CUSTOM'::business_manager."UiPageType" NOT NULL,
    layout business_manager."UiPageLayout" DEFAULT 'SIDEBAR'::business_manager."UiPageLayout" NOT NULL,
    visibility business_manager."UiPageVisibility" DEFAULT 'ALWAYS'::business_manager."UiPageVisibility" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    permissions jsonb,
    components jsonb,
    metadata jsonb,
    status business_manager."UiThemeStatus" DEFAULT 'DRAFT'::business_manager."UiThemeStatus" NOT NULL,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ui_theme_settings; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.ui_theme_settings (
    id uuid NOT NULL,
    "applicationId" uuid NOT NULL,
    "applicationVersionId" uuid NOT NULL,
    tokens jsonb NOT NULL,
    status business_manager."UiThemeStatus" DEFAULT 'DRAFT'::business_manager."UiThemeStatus" NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    "tenantId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: usage_aggregate; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.usage_aggregate (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "subscriptionId" text,
    "meterKey" text NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    value numeric(18,4) DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: usage_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.usage_event (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "tenantId" text NOT NULL,
    "subscriptionId" text,
    "meterKey" text NOT NULL,
    quantity numeric(18,4) NOT NULL,
    unit text NOT NULL,
    "occurredAt" timestamp(3) without time zone NOT NULL,
    source text NOT NULL,
    "resourceId" text,
    "correlationId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_identity; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.user_identity (
    id text NOT NULL,
    "userId" text NOT NULL,
    "identityId" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "linkedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "linkedBy" text,
    "unlinkedAt" timestamp(3) without time zone,
    "unlinkedBy" text
);


--
-- Name: webhook_deliveries; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.webhook_deliveries (
    id uuid NOT NULL,
    "webhookId" uuid NOT NULL,
    "eventId" character varying(150) NOT NULL,
    attempt integer DEFAULT 1 NOT NULL,
    status business_manager."WebhookDeliveryStatus" DEFAULT 'PENDING'::business_manager."WebhookDeliveryStatus" NOT NULL,
    "httpStatus" integer,
    duration integer,
    "nextRetryAt" timestamp(3) without time zone,
    "traceId" character varying(100),
    "startedAt" timestamp(3) without time zone,
    "finishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: webhook_event; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.webhook_event (
    id text NOT NULL,
    provider text NOT NULL,
    "providerEventId" text NOT NULL,
    "signatureValid" boolean NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "processedAt" timestamp(3) without time zone,
    payload jsonb NOT NULL,
    "receivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: webhooks; Type: TABLE; Schema: business_manager; Owner: -
--

CREATE TABLE business_manager.webhooks (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    direction business_manager."WebhookDirection" NOT NULL,
    event character varying(150) NOT NULL,
    endpoint character varying(500) NOT NULL,
    status business_manager."WebhookStatus" DEFAULT 'DRAFT'::business_manager."WebhookStatus" NOT NULL,
    "secretRef" character varying(255),
    "signaturePolicy" jsonb,
    "retryPolicy" jsonb,
    timeout integer,
    filters jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: access_policy access_policy_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.access_policy
    ADD CONSTRAINT access_policy_pkey PRIMARY KEY (id);


--
-- Name: adapter_registry adapter_registry_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.adapter_registry
    ADD CONSTRAINT adapter_registry_pkey PRIMARY KEY (id);


--
-- Name: admin_delegation admin_delegation_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.admin_delegation
    ADD CONSTRAINT admin_delegation_pkey PRIMARY KEY (id);


--
-- Name: administrative_action administrative_action_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.administrative_action
    ADD CONSTRAINT administrative_action_pkey PRIMARY KEY (id);


--
-- Name: api_definitions api_definitions_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.api_definitions
    ADD CONSTRAINT api_definitions_pkey PRIMARY KEY (id);


--
-- Name: application_versions application_versions_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.application_versions
    ADD CONSTRAINT application_versions_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: audit_event audit_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.audit_event
    ADD CONSTRAINT audit_event_pkey PRIMARY KEY (id);


--
-- Name: authorization_decision authorization_decision_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.authorization_decision
    ADD CONSTRAINT authorization_decision_pkey PRIMARY KEY (id);


--
-- Name: billing_account billing_account_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_account
    ADD CONSTRAINT billing_account_pkey PRIMARY KEY (id);


--
-- Name: billing_adjustment billing_adjustment_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_adjustment
    ADD CONSTRAINT billing_adjustment_pkey PRIMARY KEY (id);


--
-- Name: billing_credit billing_credit_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_credit
    ADD CONSTRAINT billing_credit_pkey PRIMARY KEY (id);


--
-- Name: billing_diagnostic billing_diagnostic_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_diagnostic
    ADD CONSTRAINT billing_diagnostic_pkey PRIMARY KEY (id);


--
-- Name: billing_event billing_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_event
    ADD CONSTRAINT billing_event_pkey PRIMARY KEY (id);


--
-- Name: billing_price billing_price_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_price
    ADD CONSTRAINT billing_price_pkey PRIMARY KEY (id);


--
-- Name: billing_product billing_product_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_product
    ADD CONSTRAINT billing_product_pkey PRIMARY KEY (id);


--
-- Name: billing_webhook_event billing_webhook_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.billing_webhook_event
    ADD CONSTRAINT billing_webhook_event_pkey PRIMARY KEY (id);


--
-- Name: bm_capability_dependencies bm_capability_dependencies_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_capability_dependencies
    ADD CONSTRAINT bm_capability_dependencies_pkey PRIMARY KEY (id);


--
-- Name: bm_computed_fields bm_computed_fields_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_computed_fields
    ADD CONSTRAINT bm_computed_fields_pkey PRIMARY KEY (id);


--
-- Name: bm_constraints bm_constraints_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_constraints
    ADD CONSTRAINT bm_constraints_pkey PRIMARY KEY (id);


--
-- Name: bm_contract_versions bm_contract_versions_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_contract_versions
    ADD CONSTRAINT bm_contract_versions_pkey PRIMARY KEY (id);


--
-- Name: bm_contracts bm_contracts_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_contracts
    ADD CONSTRAINT bm_contracts_pkey PRIMARY KEY (id);


--
-- Name: bm_entities bm_entities_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_entities
    ADD CONSTRAINT bm_entities_pkey PRIMARY KEY (id);


--
-- Name: bm_feature_capabilities bm_feature_capabilities_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_feature_capabilities
    ADD CONSTRAINT bm_feature_capabilities_pkey PRIMARY KEY (id);


--
-- Name: bm_features bm_features_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_features
    ADD CONSTRAINT bm_features_pkey PRIMARY KEY (id);


--
-- Name: bm_field_validations bm_field_validations_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_field_validations
    ADD CONSTRAINT bm_field_validations_pkey PRIMARY KEY (id);


--
-- Name: bm_fields bm_fields_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_fields
    ADD CONSTRAINT bm_fields_pkey PRIMARY KEY (id);


--
-- Name: bm_index_fields bm_index_fields_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_index_fields
    ADD CONSTRAINT bm_index_fields_pkey PRIMARY KEY (id);


--
-- Name: bm_indexes bm_indexes_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_indexes
    ADD CONSTRAINT bm_indexes_pkey PRIMARY KEY (id);


--
-- Name: bm_menus bm_menus_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_menus
    ADD CONSTRAINT bm_menus_pkey PRIMARY KEY (id);


--
-- Name: bm_navigation_items bm_navigation_items_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_navigation_items
    ADD CONSTRAINT bm_navigation_items_pkey PRIMARY KEY (id);


--
-- Name: bm_quality_gates bm_quality_gates_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_gates
    ADD CONSTRAINT bm_quality_gates_pkey PRIMARY KEY (id);


--
-- Name: bm_quality_issues bm_quality_issues_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_issues
    ADD CONSTRAINT bm_quality_issues_pkey PRIMARY KEY (id);


--
-- Name: bm_quality_metrics bm_quality_metrics_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_metrics
    ADD CONSTRAINT bm_quality_metrics_pkey PRIMARY KEY (id);


--
-- Name: bm_quality_reports bm_quality_reports_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_reports
    ADD CONSTRAINT bm_quality_reports_pkey PRIMARY KEY (id);


--
-- Name: bm_relations bm_relations_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_relations
    ADD CONSTRAINT bm_relations_pkey PRIMARY KEY (id);


--
-- Name: bm_runtime_bindings bm_runtime_bindings_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_runtime_bindings
    ADD CONSTRAINT bm_runtime_bindings_pkey PRIMARY KEY (id);


--
-- Name: bm_runtime_manifests bm_runtime_manifests_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_runtime_manifests
    ADD CONSTRAINT bm_runtime_manifests_pkey PRIMARY KEY (id);


--
-- Name: bm_test_cases bm_test_cases_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_test_cases
    ADD CONSTRAINT bm_test_cases_pkey PRIMARY KEY (id);


--
-- Name: bm_test_runs bm_test_runs_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_test_runs
    ADD CONSTRAINT bm_test_runs_pkey PRIMARY KEY (id);


--
-- Name: bm_test_suites bm_test_suites_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_test_suites
    ADD CONSTRAINT bm_test_suites_pkey PRIMARY KEY (id);


--
-- Name: bm_validation_campaigns bm_validation_campaigns_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_validation_campaigns
    ADD CONSTRAINT bm_validation_campaigns_pkey PRIMARY KEY (id);


--
-- Name: bm_validation_runs bm_validation_runs_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_validation_runs
    ADD CONSTRAINT bm_validation_runs_pkey PRIMARY KEY (id);


--
-- Name: bm_version_capabilities bm_version_capabilities_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_version_capabilities
    ADD CONSTRAINT bm_version_capabilities_pkey PRIMARY KEY (id);


--
-- Name: bm_version_features bm_version_features_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_version_features
    ADD CONSTRAINT bm_version_features_pkey PRIMARY KEY (id);


--
-- Name: configuration_history configuration_history_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.configuration_history
    ADD CONSTRAINT configuration_history_pkey PRIMARY KEY (id);


--
-- Name: configurations configurations_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.configurations
    ADD CONSTRAINT configurations_pkey PRIMARY KEY (id);


--
-- Name: connectors connectors_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.connectors
    ADD CONSTRAINT connectors_pkey PRIMARY KEY (id);


--
-- Name: context_invalidation context_invalidation_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.context_invalidation
    ADD CONSTRAINT context_invalidation_pkey PRIMARY KEY (id);


--
-- Name: context_snapshot context_snapshot_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.context_snapshot
    ADD CONSTRAINT context_snapshot_pkey PRIMARY KEY (id);


--
-- Name: context_switch_event context_switch_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.context_switch_event
    ADD CONSTRAINT context_switch_event_pkey PRIMARY KEY (id);


--
-- Name: contract_consumers contract_consumers_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contract_consumers
    ADD CONSTRAINT contract_consumers_pkey PRIMARY KEY (id);


--
-- Name: contract_history contract_history_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contract_history
    ADD CONSTRAINT contract_history_pkey PRIMARY KEY (id);


--
-- Name: contract_providers contract_providers_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contract_providers
    ADD CONSTRAINT contract_providers_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: credential_references credential_references_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.credential_references
    ADD CONSTRAINT credential_references_pkey PRIMARY KEY (id);


--
-- Name: deployment_gates deployment_gates_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_gates
    ADD CONSTRAINT deployment_gates_pkey PRIMARY KEY (id);


--
-- Name: deployment_history deployment_history_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_history
    ADD CONSTRAINT deployment_history_pkey PRIMARY KEY (id);


--
-- Name: deployments deployments_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);


--
-- Name: entity_mapping entity_mapping_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.entity_mapping
    ADD CONSTRAINT entity_mapping_pkey PRIMARY KEY (id);


--
-- Name: environment_deployments environment_deployments_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_deployments
    ADD CONSTRAINT environment_deployments_pkey PRIMARY KEY (id);


--
-- Name: environment_history environment_history_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_history
    ADD CONSTRAINT environment_history_pkey PRIMARY KEY (id);


--
-- Name: environments environments_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environments
    ADD CONSTRAINT environments_pkey PRIMARY KEY (id);


--
-- Name: erp_registry erp_registry_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.erp_registry
    ADD CONSTRAINT erp_registry_pkey PRIMARY KEY (id);


--
-- Name: external_identity_link external_identity_link_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.external_identity_link
    ADD CONSTRAINT external_identity_link_pkey PRIMARY KEY (id);


--
-- Name: feature feature_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.feature
    ADD CONSTRAINT feature_pkey PRIMARY KEY (code);


--
-- Name: group_member group_member_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.group_member
    ADD CONSTRAINT group_member_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: iam_credential iam_credential_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_credential
    ADD CONSTRAINT iam_credential_pkey PRIMARY KEY (id);


--
-- Name: iam_device iam_device_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_device
    ADD CONSTRAINT iam_device_pkey PRIMARY KEY (id);


--
-- Name: iam_password_history iam_password_history_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_password_history
    ADD CONSTRAINT iam_password_history_pkey PRIMARY KEY (id);


--
-- Name: iam_refresh_token iam_refresh_token_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_refresh_token
    ADD CONSTRAINT iam_refresh_token_pkey PRIMARY KEY (id);


--
-- Name: iam_session iam_session_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_session
    ADD CONSTRAINT iam_session_pkey PRIMARY KEY (id);


--
-- Name: iam_user iam_user_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_user
    ADD CONSTRAINT iam_user_pkey PRIMARY KEY (id);


--
-- Name: identity identity_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.identity
    ADD CONSTRAINT identity_pkey PRIMARY KEY (id);


--
-- Name: integration_logs integration_logs_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.integration_logs
    ADD CONSTRAINT integration_logs_pkey PRIMARY KEY (id);


--
-- Name: invoice_item invoice_item_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.invoice_item
    ADD CONSTRAINT invoice_item_pkey PRIMARY KEY (id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);


--
-- Name: membership membership_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.membership
    ADD CONSTRAINT membership_pkey PRIMARY KEY (id);


--
-- Name: meter meter_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.meter
    ADD CONSTRAINT meter_pkey PRIMARY KEY (id);


--
-- Name: mfa_method mfa_method_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.mfa_method
    ADD CONSTRAINT mfa_method_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: outbox_event outbox_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.outbox_event
    ADD CONSTRAINT outbox_event_pkey PRIMARY KEY (id);


--
-- Name: payment_attempt payment_attempt_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.payment_attempt
    ADD CONSTRAINT payment_attempt_pkey PRIMARY KEY (id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- Name: payment payment_tenantId_idempotencyKey_key; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.payment
    ADD CONSTRAINT "payment_tenantId_idempotencyKey_key" UNIQUE ("tenantId", "idempotencyKey");


--
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);


--
-- Name: plan_entitlement plan_entitlement_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.plan_entitlement
    ADD CONSTRAINT plan_entitlement_pkey PRIMARY KEY (id);


--
-- Name: plan plan_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.plan
    ADD CONSTRAINT plan_pkey PRIMARY KEY (id);


--
-- Name: platform_diagnostic platform_diagnostic_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.platform_diagnostic
    ADD CONSTRAINT platform_diagnostic_pkey PRIMARY KEY (id);


--
-- Name: platform_maintenance platform_maintenance_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.platform_maintenance
    ADD CONSTRAINT platform_maintenance_pkey PRIMARY KEY (id);


--
-- Name: platform_service platform_service_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.platform_service
    ADD CONSTRAINT platform_service_pkey PRIMARY KEY (id);


--
-- Name: pm_capabilities pm_capabilities_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_capabilities
    ADD CONSTRAINT pm_capabilities_pkey PRIMARY KEY (id);


--
-- Name: pm_dependencies pm_dependencies_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_dependencies
    ADD CONSTRAINT pm_dependencies_pkey PRIMARY KEY (id);


--
-- Name: pm_feature_capabilities pm_feature_capabilities_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_feature_capabilities
    ADD CONSTRAINT pm_feature_capabilities_pkey PRIMARY KEY (id);


--
-- Name: pm_manifests pm_manifests_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_manifests
    ADD CONSTRAINT pm_manifests_pkey PRIMARY KEY (id);


--
-- Name: pm_pack_features pm_pack_features_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_features
    ADD CONSTRAINT pm_pack_features_pkey PRIMARY KEY (id);


--
-- Name: pm_pack_modules pm_pack_modules_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_modules
    ADD CONSTRAINT pm_pack_modules_pkey PRIMARY KEY (id);


--
-- Name: pm_pack_versions pm_pack_versions_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_versions
    ADD CONSTRAINT pm_pack_versions_pkey PRIMARY KEY (id);


--
-- Name: pm_packs pm_packs_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_packs
    ADD CONSTRAINT pm_packs_pkey PRIMARY KEY (id);


--
-- Name: pm_rules pm_rules_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_rules
    ADD CONSTRAINT pm_rules_pkey PRIMARY KEY (id);


--
-- Name: pm_snapshots pm_snapshots_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_snapshots
    ADD CONSTRAINT pm_snapshots_pkey PRIMARY KEY (id);


--
-- Name: pm_validations pm_validations_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_validations
    ADD CONSTRAINT pm_validations_pkey PRIMARY KEY (id);


--
-- Name: policy_condition policy_condition_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.policy_condition
    ADD CONSTRAINT policy_condition_pkey PRIMARY KEY (id);


--
-- Name: pr_effective_manifests pr_effective_manifests_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_effective_manifests
    ADD CONSTRAINT pr_effective_manifests_pkey PRIMARY KEY (id);


--
-- Name: pr_runtime_diagnostics pr_runtime_diagnostics_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_runtime_diagnostics
    ADD CONSTRAINT pr_runtime_diagnostics_pkey PRIMARY KEY (id);


--
-- Name: pr_runtime_resolution_steps pr_runtime_resolution_steps_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_runtime_resolution_steps
    ADD CONSTRAINT pr_runtime_resolution_steps_pkey PRIMARY KEY (id);


--
-- Name: pr_runtime_resolutions pr_runtime_resolutions_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_runtime_resolutions
    ADD CONSTRAINT pr_runtime_resolutions_pkey PRIMARY KEY (id);


--
-- Name: quota_usage quota_usage_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.quota_usage
    ADD CONSTRAINT quota_usage_pkey PRIMARY KEY (id);


--
-- Name: recovery_code recovery_code_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.recovery_code
    ADD CONSTRAINT recovery_code_pkey PRIMARY KEY (id);


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.releases
    ADD CONSTRAINT releases_pkey PRIMARY KEY (id);


--
-- Name: role_assignment role_assignment_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_assignment
    ADD CONSTRAINT role_assignment_pkey PRIMARY KEY (id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY ("roleId", "permissionId");


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: rollbacks rollbacks_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.rollbacks
    ADD CONSTRAINT rollbacks_pkey PRIMARY KEY (id);


--
-- Name: security_event security_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.security_event
    ADD CONSTRAINT security_event_pkey PRIMARY KEY (id);


--
-- Name: service_account_credential service_account_credential_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.service_account_credential
    ADD CONSTRAINT service_account_credential_pkey PRIMARY KEY (id);


--
-- Name: service_account service_account_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.service_account
    ADD CONSTRAINT service_account_pkey PRIMARY KEY (id);


--
-- Name: site site_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.site
    ADD CONSTRAINT site_pkey PRIMARY KEY (id);


--
-- Name: snapshot_history snapshot_history_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.snapshot_history
    ADD CONSTRAINT snapshot_history_pkey PRIMARY KEY (id);


--
-- Name: snapshots snapshots_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.snapshots
    ADD CONSTRAINT snapshots_pkey PRIMARY KEY (id);


--
-- Name: subscription_entitlement_override subscription_entitlement_override_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.subscription_entitlement_override
    ADD CONSTRAINT subscription_entitlement_override_pkey PRIMARY KEY (id);


--
-- Name: subscription subscription_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.subscription
    ADD CONSTRAINT subscription_pkey PRIMARY KEY (id);


--
-- Name: synchronizations synchronizations_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.synchronizations
    ADD CONSTRAINT synchronizations_pkey PRIMARY KEY (id);


--
-- Name: tenant tenant_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (id);


--
-- Name: ui_pages ui_pages_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.ui_pages
    ADD CONSTRAINT ui_pages_pkey PRIMARY KEY (id);


--
-- Name: ui_theme_settings ui_theme_settings_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.ui_theme_settings
    ADD CONSTRAINT ui_theme_settings_pkey PRIMARY KEY (id);


--
-- Name: usage_aggregate usage_aggregate_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.usage_aggregate
    ADD CONSTRAINT usage_aggregate_pkey PRIMARY KEY (id);


--
-- Name: usage_event usage_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.usage_event
    ADD CONSTRAINT usage_event_pkey PRIMARY KEY (id);


--
-- Name: user_identity user_identity_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.user_identity
    ADD CONSTRAINT user_identity_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhook_event webhook_event_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.webhook_event
    ADD CONSTRAINT webhook_event_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: access_policy_effectiveFrom_effectiveUntil_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "access_policy_effectiveFrom_effectiveUntil_idx" ON business_manager.access_policy USING btree ("effectiveFrom", "effectiveUntil");


--
-- Name: access_policy_resource_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX access_policy_resource_action_idx ON business_manager.access_policy USING btree (resource, action);


--
-- Name: access_policy_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX access_policy_status_idx ON business_manager.access_policy USING btree (status);


--
-- Name: access_policy_tenantId_code_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "access_policy_tenantId_code_version_key" ON business_manager.access_policy USING btree ("tenantId", code, version);


--
-- Name: access_policy_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "access_policy_tenantId_idx" ON business_manager.access_policy USING btree ("tenantId");


--
-- Name: adapter_registry_adapter_id_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX adapter_registry_adapter_id_key ON business_manager.adapter_registry USING btree (adapter_id);


--
-- Name: admin_delegation_granteeUserId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "admin_delegation_granteeUserId_idx" ON business_manager.admin_delegation USING btree ("granteeUserId");


--
-- Name: admin_delegation_grantorUserId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "admin_delegation_grantorUserId_idx" ON business_manager.admin_delegation USING btree ("grantorUserId");


--
-- Name: admin_delegation_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX admin_delegation_status_idx ON business_manager.admin_delegation USING btree (status);


--
-- Name: admin_delegation_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "admin_delegation_tenantId_idx" ON business_manager.admin_delegation USING btree ("tenantId");


--
-- Name: administrative_action_actorId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "administrative_action_actorId_idx" ON business_manager.administrative_action USING btree ("actorId");


--
-- Name: administrative_action_requestedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "administrative_action_requestedAt_idx" ON business_manager.administrative_action USING btree ("requestedAt");


--
-- Name: administrative_action_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX administrative_action_status_idx ON business_manager.administrative_action USING btree (status);


--
-- Name: administrative_action_targetType_targetId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "administrative_action_targetType_targetId_idx" ON business_manager.administrative_action USING btree ("targetType", "targetId");


--
-- Name: administrative_action_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "administrative_action_tenantId_idx" ON business_manager.administrative_action USING btree ("tenantId");


--
-- Name: administrative_action_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "administrative_action_traceId_idx" ON business_manager.administrative_action USING btree ("traceId");


--
-- Name: api_definitions_apiCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "api_definitions_apiCode_idx" ON business_manager.api_definitions USING btree ("apiCode");


--
-- Name: api_definitions_apiCode_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "api_definitions_apiCode_version_key" ON business_manager.api_definitions USING btree ("apiCode", version);


--
-- Name: api_definitions_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX api_definitions_status_idx ON business_manager.api_definitions USING btree (status);


--
-- Name: application_versions_applicationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "application_versions_applicationId_idx" ON business_manager.application_versions USING btree ("applicationId");


--
-- Name: application_versions_applicationId_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "application_versions_applicationId_version_key" ON business_manager.application_versions USING btree ("applicationId", version);


--
-- Name: application_versions_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX application_versions_status_idx ON business_manager.application_versions USING btree (status);


--
-- Name: application_versions_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "application_versions_tenantId_idx" ON business_manager.application_versions USING btree ("tenantId");


--
-- Name: application_versions_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "application_versions_tenantId_status_idx" ON business_manager.application_versions USING btree ("tenantId", status);


--
-- Name: applications_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX applications_code_key ON business_manager.applications USING btree (code);


--
-- Name: applications_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX applications_status_idx ON business_manager.applications USING btree (status);


--
-- Name: applications_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "applications_tenantId_code_key" ON business_manager.applications USING btree ("tenantId", code);


--
-- Name: applications_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "applications_tenantId_idx" ON business_manager.applications USING btree ("tenantId");


--
-- Name: applications_tenantScope_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "applications_tenantScope_idx" ON business_manager.applications USING btree ("tenantScope");


--
-- Name: audit_event_actorId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "audit_event_actorId_idx" ON business_manager.audit_event USING btree ("actorId");


--
-- Name: audit_event_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "audit_event_createdAt_idx" ON business_manager.audit_event USING btree ("createdAt");


--
-- Name: audit_event_effectiveUserId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "audit_event_effectiveUserId_idx" ON business_manager.audit_event USING btree ("effectiveUserId");


--
-- Name: audit_event_targetType_targetId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "audit_event_targetType_targetId_idx" ON business_manager.audit_event USING btree ("targetType", "targetId");


--
-- Name: audit_event_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "audit_event_tenantId_idx" ON business_manager.audit_event USING btree ("tenantId");


--
-- Name: audit_event_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "audit_event_traceId_idx" ON business_manager.audit_event USING btree ("traceId");


--
-- Name: authorization_decision_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "authorization_decision_createdAt_idx" ON business_manager.authorization_decision USING btree ("createdAt");


--
-- Name: authorization_decision_resource_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX authorization_decision_resource_action_idx ON business_manager.authorization_decision USING btree (resource, action);


--
-- Name: authorization_decision_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "authorization_decision_tenantId_idx" ON business_manager.authorization_decision USING btree ("tenantId");


--
-- Name: authorization_decision_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "authorization_decision_traceId_idx" ON business_manager.authorization_decision USING btree ("traceId");


--
-- Name: authorization_decision_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "authorization_decision_userId_idx" ON business_manager.authorization_decision USING btree ("userId");


--
-- Name: billing_account_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_account_status_idx ON business_manager.billing_account USING btree (status);


--
-- Name: billing_account_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_account_tenantId_idx" ON business_manager.billing_account USING btree ("tenantId");


--
-- Name: billing_adjustment_invoiceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_adjustment_invoiceId_idx" ON business_manager.billing_adjustment USING btree ("invoiceId");


--
-- Name: billing_adjustment_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_adjustment_tenantId_idx" ON business_manager.billing_adjustment USING btree ("tenantId");


--
-- Name: billing_credit_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_credit_status_idx ON business_manager.billing_credit USING btree (status);


--
-- Name: billing_credit_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_credit_tenantId_idx" ON business_manager.billing_credit USING btree ("tenantId");


--
-- Name: billing_diagnostic_checkedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_diagnostic_checkedAt_idx" ON business_manager.billing_diagnostic USING btree ("checkedAt");


--
-- Name: billing_diagnostic_stage_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_diagnostic_stage_idx ON business_manager.billing_diagnostic USING btree (stage);


--
-- Name: billing_diagnostic_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_diagnostic_status_idx ON business_manager.billing_diagnostic USING btree (status);


--
-- Name: billing_diagnostic_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_diagnostic_tenantId_idx" ON business_manager.billing_diagnostic USING btree ("tenantId");


--
-- Name: billing_event_eventType_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_event_eventType_idx" ON business_manager.billing_event USING btree ("eventType");


--
-- Name: billing_event_invoiceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_event_invoiceId_idx" ON business_manager.billing_event USING btree ("invoiceId");


--
-- Name: billing_event_occurredAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_event_occurredAt_idx" ON business_manager.billing_event USING btree ("occurredAt");


--
-- Name: billing_event_paymentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_event_paymentId_idx" ON business_manager.billing_event USING btree ("paymentId");


--
-- Name: billing_event_subscriptionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_event_subscriptionId_idx" ON business_manager.billing_event USING btree ("subscriptionId");


--
-- Name: billing_event_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_event_tenantId_idx" ON business_manager.billing_event USING btree ("tenantId");


--
-- Name: billing_price_currency_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_price_currency_idx ON business_manager.billing_price USING btree (currency);


--
-- Name: billing_price_planId_currency_interval_intervalCount_effectiveF; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "billing_price_planId_currency_interval_intervalCount_effectiveF" ON business_manager.billing_price USING btree ("planId", currency, "interval", "intervalCount", "effectiveFrom");


--
-- Name: billing_price_planId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "billing_price_planId_status_idx" ON business_manager.billing_price USING btree ("planId", status);


--
-- Name: billing_product_key_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX billing_product_key_key ON business_manager.billing_product USING btree (key);


--
-- Name: billing_product_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_product_status_idx ON business_manager.billing_product USING btree (status);


--
-- Name: billing_webhook_event_provider_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX billing_webhook_event_provider_idx ON business_manager.billing_webhook_event USING btree (provider);


--
-- Name: billing_webhook_event_provider_providerEventId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "billing_webhook_event_provider_providerEventId_key" ON business_manager.billing_webhook_event USING btree (provider, "providerEventId");


--
-- Name: bm_capability_dependencies_capabilityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_capability_dependencies_capabilityId_idx" ON business_manager.bm_capability_dependencies USING btree ("capabilityId");


--
-- Name: bm_capability_dependencies_capabilityId_targetCapabilityCod_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_capability_dependencies_capabilityId_targetCapabilityCod_key" ON business_manager.bm_capability_dependencies USING btree ("capabilityId", "targetCapabilityCode", "dependencyType");


--
-- Name: bm_computed_fields_applicationVersionId_entityId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_computed_fields_applicationVersionId_entityId_code_key" ON business_manager.bm_computed_fields USING btree ("applicationVersionId", "entityId", code);


--
-- Name: bm_computed_fields_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_computed_fields_applicationVersionId_idx" ON business_manager.bm_computed_fields USING btree ("applicationVersionId");


--
-- Name: bm_computed_fields_entityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_computed_fields_entityId_idx" ON business_manager.bm_computed_fields USING btree ("entityId");


--
-- Name: bm_computed_fields_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_computed_fields_tenantId_idx" ON business_manager.bm_computed_fields USING btree ("tenantId");


--
-- Name: bm_constraints_entityId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_constraints_entityId_code_key" ON business_manager.bm_constraints USING btree ("entityId", code);


--
-- Name: bm_constraints_entityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_constraints_entityId_idx" ON business_manager.bm_constraints USING btree ("entityId");


--
-- Name: bm_constraints_fieldId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_constraints_fieldId_idx" ON business_manager.bm_constraints USING btree ("fieldId");


--
-- Name: bm_constraints_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_constraints_tenantId_idx" ON business_manager.bm_constraints USING btree ("tenantId");


--
-- Name: bm_contract_versions_contractId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_contract_versions_contractId_idx" ON business_manager.bm_contract_versions USING btree ("contractId");


--
-- Name: bm_contract_versions_contractId_versionNumber_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_contract_versions_contractId_versionNumber_key" ON business_manager.bm_contract_versions USING btree ("contractId", "versionNumber");


--
-- Name: bm_contracts_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_contracts_applicationVersionId_idx" ON business_manager.bm_contracts USING btree ("applicationVersionId");


--
-- Name: bm_contracts_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_contracts_status_idx ON business_manager.bm_contracts USING btree (status);


--
-- Name: bm_contracts_tenantId_applicationId_applicationVersionId_co_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_contracts_tenantId_applicationId_applicationVersionId_co_key" ON business_manager.bm_contracts USING btree ("tenantId", "applicationId", "applicationVersionId", code, version);


--
-- Name: bm_contracts_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_contracts_tenantId_idx" ON business_manager.bm_contracts USING btree ("tenantId");


--
-- Name: bm_entities_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_entities_applicationVersionId_idx" ON business_manager.bm_entities USING btree ("applicationVersionId");


--
-- Name: bm_entities_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_entities_status_idx ON business_manager.bm_entities USING btree (status);


--
-- Name: bm_entities_tenantId_applicationId_applicationVersionId_cod_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_entities_tenantId_applicationId_applicationVersionId_cod_key" ON business_manager.bm_entities USING btree ("tenantId", "applicationId", "applicationVersionId", code);


--
-- Name: bm_entities_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_entities_tenantId_idx" ON business_manager.bm_entities USING btree ("tenantId");


--
-- Name: bm_feature_capabilities_featureId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_feature_capabilities_featureId_code_key" ON business_manager.bm_feature_capabilities USING btree ("featureId", code);


--
-- Name: bm_feature_capabilities_featureId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_feature_capabilities_featureId_idx" ON business_manager.bm_feature_capabilities USING btree ("featureId");


--
-- Name: bm_feature_capabilities_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_feature_capabilities_status_idx ON business_manager.bm_feature_capabilities USING btree (status);


--
-- Name: bm_feature_capabilities_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_feature_capabilities_tenantId_idx" ON business_manager.bm_feature_capabilities USING btree ("tenantId");


--
-- Name: bm_features_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_features_applicationVersionId_idx" ON business_manager.bm_features USING btree ("applicationVersionId");


--
-- Name: bm_features_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_features_status_idx ON business_manager.bm_features USING btree (status);


--
-- Name: bm_features_tenantId_applicationId_applicationVersionId_cod_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_features_tenantId_applicationId_applicationVersionId_cod_key" ON business_manager.bm_features USING btree ("tenantId", "applicationId", "applicationVersionId", code);


--
-- Name: bm_features_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_features_tenantId_idx" ON business_manager.bm_features USING btree ("tenantId");


--
-- Name: bm_field_validations_fieldId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_field_validations_fieldId_idx" ON business_manager.bm_field_validations USING btree ("fieldId");


--
-- Name: bm_field_validations_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_field_validations_tenantId_idx" ON business_manager.bm_field_validations USING btree ("tenantId");


--
-- Name: bm_fields_entityId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_fields_entityId_code_key" ON business_manager.bm_fields USING btree ("entityId", code);


--
-- Name: bm_fields_entityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_fields_entityId_idx" ON business_manager.bm_fields USING btree ("entityId");


--
-- Name: bm_fields_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_fields_tenantId_idx" ON business_manager.bm_fields USING btree ("tenantId");


--
-- Name: bm_index_fields_fieldId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_index_fields_fieldId_idx" ON business_manager.bm_index_fields USING btree ("fieldId");


--
-- Name: bm_index_fields_indexId_fieldId_position_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_index_fields_indexId_fieldId_position_key" ON business_manager.bm_index_fields USING btree ("indexId", "fieldId", "position");


--
-- Name: bm_index_fields_indexId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_index_fields_indexId_idx" ON business_manager.bm_index_fields USING btree ("indexId");


--
-- Name: bm_indexes_entityId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_indexes_entityId_code_key" ON business_manager.bm_indexes USING btree ("entityId", code);


--
-- Name: bm_indexes_entityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_indexes_entityId_idx" ON business_manager.bm_indexes USING btree ("entityId");


--
-- Name: bm_indexes_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_indexes_tenantId_idx" ON business_manager.bm_indexes USING btree ("tenantId");


--
-- Name: bm_menus_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_menus_applicationVersionId_idx" ON business_manager.bm_menus USING btree ("applicationVersionId");


--
-- Name: bm_menus_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_menus_status_idx ON business_manager.bm_menus USING btree (status);


--
-- Name: bm_menus_tenantId_applicationId_applicationVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_menus_tenantId_applicationId_applicationVersionId_code_key" ON business_manager.bm_menus USING btree ("tenantId", "applicationId", "applicationVersionId", code);


--
-- Name: bm_menus_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_menus_tenantId_idx" ON business_manager.bm_menus USING btree ("tenantId");


--
-- Name: bm_navigation_items_menuId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_navigation_items_menuId_code_key" ON business_manager.bm_navigation_items USING btree ("menuId", code);


--
-- Name: bm_navigation_items_menuId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_navigation_items_menuId_idx" ON business_manager.bm_navigation_items USING btree ("menuId");


--
-- Name: bm_navigation_items_parentItemId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_navigation_items_parentItemId_idx" ON business_manager.bm_navigation_items USING btree ("parentItemId");


--
-- Name: bm_navigation_items_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_navigation_items_tenantId_idx" ON business_manager.bm_navigation_items USING btree ("tenantId");


--
-- Name: bm_quality_gates_applicationVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_quality_gates_applicationVersionId_code_key" ON business_manager.bm_quality_gates USING btree ("applicationVersionId", code);


--
-- Name: bm_quality_gates_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_gates_applicationVersionId_idx" ON business_manager.bm_quality_gates USING btree ("applicationVersionId");


--
-- Name: bm_quality_gates_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_gates_tenantId_idx" ON business_manager.bm_quality_gates USING btree ("tenantId");


--
-- Name: bm_quality_issues_reportId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_issues_reportId_idx" ON business_manager.bm_quality_issues USING btree ("reportId");


--
-- Name: bm_quality_issues_ruleCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_issues_ruleCode_idx" ON business_manager.bm_quality_issues USING btree ("ruleCode");


--
-- Name: bm_quality_issues_runId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_issues_runId_idx" ON business_manager.bm_quality_issues USING btree ("runId");


--
-- Name: bm_quality_issues_severity_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_quality_issues_severity_idx ON business_manager.bm_quality_issues USING btree (severity);


--
-- Name: bm_quality_metrics_reportId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_metrics_reportId_idx" ON business_manager.bm_quality_metrics USING btree ("reportId");


--
-- Name: bm_quality_reports_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_reports_applicationVersionId_idx" ON business_manager.bm_quality_reports USING btree ("applicationVersionId");


--
-- Name: bm_quality_reports_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_quality_reports_status_idx ON business_manager.bm_quality_reports USING btree (status);


--
-- Name: bm_quality_reports_tenantId_applicationVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_quality_reports_tenantId_applicationVersionId_code_key" ON business_manager.bm_quality_reports USING btree ("tenantId", "applicationVersionId", code);


--
-- Name: bm_quality_reports_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_quality_reports_tenantId_idx" ON business_manager.bm_quality_reports USING btree ("tenantId");


--
-- Name: bm_relations_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_relations_applicationVersionId_idx" ON business_manager.bm_relations USING btree ("applicationVersionId");


--
-- Name: bm_relations_applicationVersionId_sourceEntityId_targetEnti_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_relations_applicationVersionId_sourceEntityId_targetEnti_key" ON business_manager.bm_relations USING btree ("applicationVersionId", "sourceEntityId", "targetEntityId", code);


--
-- Name: bm_relations_sourceEntityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_relations_sourceEntityId_idx" ON business_manager.bm_relations USING btree ("sourceEntityId");


--
-- Name: bm_relations_targetEntityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_relations_targetEntityId_idx" ON business_manager.bm_relations USING btree ("targetEntityId");


--
-- Name: bm_runtime_bindings_manifestId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_runtime_bindings_manifestId_idx" ON business_manager.bm_runtime_bindings USING btree ("manifestId");


--
-- Name: bm_runtime_bindings_manifestId_targetType_targetId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_runtime_bindings_manifestId_targetType_targetId_key" ON business_manager.bm_runtime_bindings USING btree ("manifestId", "targetType", "targetId");


--
-- Name: bm_runtime_bindings_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_runtime_bindings_tenantId_idx" ON business_manager.bm_runtime_bindings USING btree ("tenantId");


--
-- Name: bm_runtime_manifests_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_runtime_manifests_applicationVersionId_idx" ON business_manager.bm_runtime_manifests USING btree ("applicationVersionId");


--
-- Name: bm_runtime_manifests_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX bm_runtime_manifests_status_idx ON business_manager.bm_runtime_manifests USING btree (status);


--
-- Name: bm_runtime_manifests_tenantId_applicationId_applicationVers_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_runtime_manifests_tenantId_applicationId_applicationVers_key" ON business_manager.bm_runtime_manifests USING btree ("tenantId", "applicationId", "applicationVersionId", code);


--
-- Name: bm_runtime_manifests_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_runtime_manifests_tenantId_idx" ON business_manager.bm_runtime_manifests USING btree ("tenantId");


--
-- Name: bm_test_cases_suiteId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_test_cases_suiteId_code_key" ON business_manager.bm_test_cases USING btree ("suiteId", code);


--
-- Name: bm_test_cases_suiteId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_test_cases_suiteId_idx" ON business_manager.bm_test_cases USING btree ("suiteId");


--
-- Name: bm_test_runs_testCaseId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_test_runs_testCaseId_idx" ON business_manager.bm_test_runs USING btree ("testCaseId");


--
-- Name: bm_test_suites_applicationVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_test_suites_applicationVersionId_code_key" ON business_manager.bm_test_suites USING btree ("applicationVersionId", code);


--
-- Name: bm_test_suites_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_test_suites_applicationVersionId_idx" ON business_manager.bm_test_suites USING btree ("applicationVersionId");


--
-- Name: bm_validation_campaigns_applicationVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_validation_campaigns_applicationVersionId_code_key" ON business_manager.bm_validation_campaigns USING btree ("applicationVersionId", code);


--
-- Name: bm_validation_campaigns_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_validation_campaigns_applicationVersionId_idx" ON business_manager.bm_validation_campaigns USING btree ("applicationVersionId");


--
-- Name: bm_validation_campaigns_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_validation_campaigns_tenantId_idx" ON business_manager.bm_validation_campaigns USING btree ("tenantId");


--
-- Name: bm_validation_runs_campaignId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_validation_runs_campaignId_code_key" ON business_manager.bm_validation_runs USING btree ("campaignId", code);


--
-- Name: bm_validation_runs_campaignId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_validation_runs_campaignId_idx" ON business_manager.bm_validation_runs USING btree ("campaignId");


--
-- Name: bm_validation_runs_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_validation_runs_tenantId_idx" ON business_manager.bm_validation_runs USING btree ("tenantId");


--
-- Name: bm_version_capabilities_applicationVersionId_capabilityCode_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_version_capabilities_applicationVersionId_capabilityCode_key" ON business_manager.bm_version_capabilities USING btree ("applicationVersionId", "capabilityCode");


--
-- Name: bm_version_capabilities_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_version_capabilities_applicationVersionId_idx" ON business_manager.bm_version_capabilities USING btree ("applicationVersionId");


--
-- Name: bm_version_capabilities_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_version_capabilities_tenantId_idx" ON business_manager.bm_version_capabilities USING btree ("tenantId");


--
-- Name: bm_version_features_applicationVersionId_featureCode_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "bm_version_features_applicationVersionId_featureCode_key" ON business_manager.bm_version_features USING btree ("applicationVersionId", "featureCode");


--
-- Name: bm_version_features_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_version_features_applicationVersionId_idx" ON business_manager.bm_version_features USING btree ("applicationVersionId");


--
-- Name: bm_version_features_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "bm_version_features_tenantId_idx" ON business_manager.bm_version_features USING btree ("tenantId");


--
-- Name: configuration_history_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX configuration_history_action_idx ON business_manager.configuration_history USING btree (action);


--
-- Name: configuration_history_configurationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "configuration_history_configurationId_idx" ON business_manager.configuration_history USING btree ("configurationId");


--
-- Name: configuration_history_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "configuration_history_createdAt_idx" ON business_manager.configuration_history USING btree ("createdAt");


--
-- Name: configuration_history_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "configuration_history_tenantId_idx" ON business_manager.configuration_history USING btree ("tenantId");


--
-- Name: configurations_key_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX configurations_key_idx ON business_manager.configurations USING btree (key);


--
-- Name: configurations_key_scope_scopeId_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "configurations_key_scope_scopeId_version_key" ON business_manager.configurations USING btree (key, scope, "scopeId", version);


--
-- Name: configurations_scope_scopeId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "configurations_scope_scopeId_idx" ON business_manager.configurations USING btree (scope, "scopeId");


--
-- Name: configurations_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX configurations_status_idx ON business_manager.configurations USING btree (status);


--
-- Name: configurations_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "configurations_tenantId_idx" ON business_manager.configurations USING btree ("tenantId");


--
-- Name: configurations_tenantId_key_scope_scopeId_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "configurations_tenantId_key_scope_scopeId_version_key" ON business_manager.configurations USING btree ("tenantId", key, scope, "scopeId", version);


--
-- Name: connectors_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX connectors_code_key ON business_manager.connectors USING btree (code);


--
-- Name: connectors_health_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX connectors_health_idx ON business_manager.connectors USING btree (health);


--
-- Name: connectors_providerType_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "connectors_providerType_idx" ON business_manager.connectors USING btree ("providerType");


--
-- Name: connectors_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX connectors_status_idx ON business_manager.connectors USING btree (status);


--
-- Name: context_invalidation_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_invalidation_createdAt_idx" ON business_manager.context_invalidation USING btree ("createdAt");


--
-- Name: context_invalidation_processedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_invalidation_processedAt_idx" ON business_manager.context_invalidation USING btree ("processedAt");


--
-- Name: context_invalidation_subjectType_subjectId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_invalidation_subjectType_subjectId_idx" ON business_manager.context_invalidation USING btree ("subjectType", "subjectId");


--
-- Name: context_invalidation_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_invalidation_tenantId_idx" ON business_manager.context_invalidation USING btree ("tenantId");


--
-- Name: context_snapshot_organizationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_snapshot_organizationId_idx" ON business_manager.context_snapshot USING btree ("organizationId");


--
-- Name: context_snapshot_resolvedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_snapshot_resolvedAt_idx" ON business_manager.context_snapshot USING btree ("resolvedAt");


--
-- Name: context_snapshot_sessionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_snapshot_sessionId_idx" ON business_manager.context_snapshot USING btree ("sessionId");


--
-- Name: context_snapshot_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_snapshot_tenantId_idx" ON business_manager.context_snapshot USING btree ("tenantId");


--
-- Name: context_snapshot_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_snapshot_traceId_idx" ON business_manager.context_snapshot USING btree ("traceId");


--
-- Name: context_snapshot_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_snapshot_userId_idx" ON business_manager.context_snapshot USING btree ("userId");


--
-- Name: context_switch_event_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_switch_event_createdAt_idx" ON business_manager.context_switch_event USING btree ("createdAt");


--
-- Name: context_switch_event_sessionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_switch_event_sessionId_idx" ON business_manager.context_switch_event USING btree ("sessionId");


--
-- Name: context_switch_event_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_switch_event_traceId_idx" ON business_manager.context_switch_event USING btree ("traceId");


--
-- Name: context_switch_event_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "context_switch_event_userId_idx" ON business_manager.context_switch_event USING btree ("userId");


--
-- Name: contract_consumers_consumerCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_consumers_consumerCode_idx" ON business_manager.contract_consumers USING btree ("consumerCode");


--
-- Name: contract_consumers_contractId_consumerCode_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "contract_consumers_contractId_consumerCode_key" ON business_manager.contract_consumers USING btree ("contractId", "consumerCode");


--
-- Name: contract_consumers_contractId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_consumers_contractId_idx" ON business_manager.contract_consumers USING btree ("contractId");


--
-- Name: contract_history_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX contract_history_action_idx ON business_manager.contract_history USING btree (action);


--
-- Name: contract_history_contractId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_history_contractId_idx" ON business_manager.contract_history USING btree ("contractId");


--
-- Name: contract_history_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_history_createdAt_idx" ON business_manager.contract_history USING btree ("createdAt");


--
-- Name: contract_history_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_history_tenantId_idx" ON business_manager.contract_history USING btree ("tenantId");


--
-- Name: contract_providers_contractId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_providers_contractId_idx" ON business_manager.contract_providers USING btree ("contractId");


--
-- Name: contract_providers_contractId_providerCode_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "contract_providers_contractId_providerCode_key" ON business_manager.contract_providers USING btree ("contractId", "providerCode");


--
-- Name: contract_providers_providerCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contract_providers_providerCode_idx" ON business_manager.contract_providers USING btree ("providerCode");


--
-- Name: contracts_contractCode_contractVersion_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "contracts_contractCode_contractVersion_key" ON business_manager.contracts USING btree ("contractCode", "contractVersion");


--
-- Name: contracts_contractCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contracts_contractCode_idx" ON business_manager.contracts USING btree ("contractCode");


--
-- Name: contracts_ownerTeam_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contracts_ownerTeam_idx" ON business_manager.contracts USING btree ("ownerTeam");


--
-- Name: contracts_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX contracts_status_idx ON business_manager.contracts USING btree (status);


--
-- Name: contracts_tenantId_contractCode_contractVersion_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "contracts_tenantId_contractCode_contractVersion_key" ON business_manager.contracts USING btree ("tenantId", "contractCode", "contractVersion");


--
-- Name: contracts_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contracts_tenantId_idx" ON business_manager.contracts USING btree ("tenantId");


--
-- Name: contracts_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "contracts_tenantId_status_idx" ON business_manager.contracts USING btree ("tenantId", status);


--
-- Name: credential_references_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX credential_references_code_key ON business_manager.credential_references USING btree (code);


--
-- Name: credential_references_expiresAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "credential_references_expiresAt_idx" ON business_manager.credential_references USING btree ("expiresAt");


--
-- Name: credential_references_provider_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX credential_references_provider_idx ON business_manager.credential_references USING btree (provider);


--
-- Name: credential_references_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX credential_references_status_idx ON business_manager.credential_references USING btree (status);


--
-- Name: credential_references_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX credential_references_type_idx ON business_manager.credential_references USING btree (type);


--
-- Name: deployment_gates_deploymentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployment_gates_deploymentId_idx" ON business_manager.deployment_gates USING btree ("deploymentId");


--
-- Name: deployment_gates_required_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployment_gates_required_idx ON business_manager.deployment_gates USING btree (required);


--
-- Name: deployment_gates_result_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployment_gates_result_idx ON business_manager.deployment_gates USING btree (result);


--
-- Name: deployment_gates_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployment_gates_type_idx ON business_manager.deployment_gates USING btree (type);


--
-- Name: deployment_history_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployment_history_action_idx ON business_manager.deployment_history USING btree (action);


--
-- Name: deployment_history_applicationId_environmentId_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployment_history_applicationId_environmentId_createdAt_idx" ON business_manager.deployment_history USING btree ("applicationId", "environmentId", "createdAt");


--
-- Name: deployment_history_deploymentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployment_history_deploymentId_idx" ON business_manager.deployment_history USING btree ("deploymentId");


--
-- Name: deployment_history_releaseId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployment_history_releaseId_idx" ON business_manager.deployment_history USING btree ("releaseId");


--
-- Name: deployment_history_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployment_history_status_idx ON business_manager.deployment_history USING btree (status);


--
-- Name: deployment_history_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployment_history_tenantId_idx" ON business_manager.deployment_history USING btree ("tenantId");


--
-- Name: deployment_history_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployment_history_traceId_idx" ON business_manager.deployment_history USING btree ("traceId");


--
-- Name: deployments_environmentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployments_environmentId_idx" ON business_manager.deployments USING btree ("environmentId");


--
-- Name: deployments_idempotencyKey_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "deployments_idempotencyKey_key" ON business_manager.deployments USING btree ("idempotencyKey");


--
-- Name: deployments_releaseId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployments_releaseId_idx" ON business_manager.deployments USING btree ("releaseId");


--
-- Name: deployments_startedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployments_startedAt_idx" ON business_manager.deployments USING btree ("startedAt");


--
-- Name: deployments_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployments_status_idx ON business_manager.deployments USING btree (status);


--
-- Name: deployments_strategy_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX deployments_strategy_idx ON business_manager.deployments USING btree (strategy);


--
-- Name: deployments_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployments_tenantId_idx" ON business_manager.deployments USING btree ("tenantId");


--
-- Name: deployments_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "deployments_traceId_idx" ON business_manager.deployments USING btree ("traceId");


--
-- Name: entity_mapping_erp_id_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX entity_mapping_erp_id_idx ON business_manager.entity_mapping USING btree (erp_id);


--
-- Name: entity_mapping_tenantId_erp_id_entity_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "entity_mapping_tenantId_erp_id_entity_key" ON business_manager.entity_mapping USING btree ("tenantId", erp_id, entity);


--
-- Name: entity_mapping_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "entity_mapping_tenantId_idx" ON business_manager.entity_mapping USING btree ("tenantId");


--
-- Name: environment_deployments_applicationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_deployments_applicationId_idx" ON business_manager.environment_deployments USING btree ("applicationId");


--
-- Name: environment_deployments_currentReleaseId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_deployments_currentReleaseId_idx" ON business_manager.environment_deployments USING btree ("currentReleaseId");


--
-- Name: environment_deployments_deploymentId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "environment_deployments_deploymentId_key" ON business_manager.environment_deployments USING btree ("deploymentId");


--
-- Name: environment_deployments_environmentId_applicationId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "environment_deployments_environmentId_applicationId_key" ON business_manager.environment_deployments USING btree ("environmentId", "applicationId");


--
-- Name: environment_deployments_environmentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_deployments_environmentId_idx" ON business_manager.environment_deployments USING btree ("environmentId");


--
-- Name: environment_deployments_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX environment_deployments_status_idx ON business_manager.environment_deployments USING btree (status);


--
-- Name: environment_deployments_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_deployments_tenantId_idx" ON business_manager.environment_deployments USING btree ("tenantId");


--
-- Name: environment_history_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX environment_history_action_idx ON business_manager.environment_history USING btree (action);


--
-- Name: environment_history_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_history_createdAt_idx" ON business_manager.environment_history USING btree ("createdAt");


--
-- Name: environment_history_environmentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_history_environmentId_idx" ON business_manager.environment_history USING btree ("environmentId");


--
-- Name: environment_history_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environment_history_tenantId_idx" ON business_manager.environment_history USING btree ("tenantId");


--
-- Name: environments_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX environments_code_key ON business_manager.environments USING btree (code);


--
-- Name: environments_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX environments_status_idx ON business_manager.environments USING btree (status);


--
-- Name: environments_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "environments_tenantId_code_key" ON business_manager.environments USING btree ("tenantId", code);


--
-- Name: environments_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "environments_tenantId_idx" ON business_manager.environments USING btree ("tenantId");


--
-- Name: environments_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX environments_type_idx ON business_manager.environments USING btree (type);


--
-- Name: erp_registry_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX erp_registry_code_key ON business_manager.erp_registry USING btree (code);


--
-- Name: erp_registry_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "erp_registry_tenantId_code_key" ON business_manager.erp_registry USING btree ("tenantId", code);


--
-- Name: erp_registry_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "erp_registry_tenantId_idx" ON business_manager.erp_registry USING btree ("tenantId");


--
-- Name: erp_registry_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "erp_registry_tenantId_status_idx" ON business_manager.erp_registry USING btree ("tenantId", status);


--
-- Name: external_identity_link_identityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "external_identity_link_identityId_idx" ON business_manager.external_identity_link USING btree ("identityId");


--
-- Name: external_identity_link_providerType_providerInstanceId_exte_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "external_identity_link_providerType_providerInstanceId_exte_key" ON business_manager.external_identity_link USING btree ("providerType", "providerInstanceId", "externalSubjectId");


--
-- Name: feature_kind_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX feature_kind_idx ON business_manager.feature USING btree (kind);


--
-- Name: feature_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX feature_status_idx ON business_manager.feature USING btree (status);


--
-- Name: group_member_groupId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "group_member_groupId_idx" ON business_manager.group_member USING btree ("groupId");


--
-- Name: group_member_groupId_userId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "group_member_groupId_userId_key" ON business_manager.group_member USING btree ("groupId", "userId");


--
-- Name: group_member_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "group_member_userId_idx" ON business_manager.group_member USING btree ("userId");


--
-- Name: groups_organizationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "groups_organizationId_idx" ON business_manager.groups USING btree ("organizationId");


--
-- Name: groups_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "groups_tenantId_code_key" ON business_manager.groups USING btree ("tenantId", code);


--
-- Name: groups_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "groups_tenantId_idx" ON business_manager.groups USING btree ("tenantId");


--
-- Name: iam_credential_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX iam_credential_status_idx ON business_manager.iam_credential USING btree (status);


--
-- Name: iam_credential_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX iam_credential_type_idx ON business_manager.iam_credential USING btree (type);


--
-- Name: iam_credential_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_credential_userId_idx" ON business_manager.iam_credential USING btree ("userId");


--
-- Name: iam_device_trustLevel_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_device_trustLevel_idx" ON business_manager.iam_device USING btree ("trustLevel");


--
-- Name: iam_device_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_device_userId_idx" ON business_manager.iam_device USING btree ("userId");


--
-- Name: iam_password_history_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_password_history_createdAt_idx" ON business_manager.iam_password_history USING btree ("createdAt");


--
-- Name: iam_password_history_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_password_history_userId_idx" ON business_manager.iam_password_history USING btree ("userId");


--
-- Name: iam_refresh_token_expiresAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_refresh_token_expiresAt_idx" ON business_manager.iam_refresh_token USING btree ("expiresAt");


--
-- Name: iam_refresh_token_familyId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_refresh_token_familyId_idx" ON business_manager.iam_refresh_token USING btree ("familyId");


--
-- Name: iam_refresh_token_sessionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_refresh_token_sessionId_idx" ON business_manager.iam_refresh_token USING btree ("sessionId");


--
-- Name: iam_refresh_token_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX iam_refresh_token_status_idx ON business_manager.iam_refresh_token USING btree (status);


--
-- Name: iam_refresh_token_tokenHash_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "iam_refresh_token_tokenHash_key" ON business_manager.iam_refresh_token USING btree ("tokenHash");


--
-- Name: iam_session_deviceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_session_deviceId_idx" ON business_manager.iam_session USING btree ("deviceId");


--
-- Name: iam_session_expiresAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_session_expiresAt_idx" ON business_manager.iam_session USING btree ("expiresAt");


--
-- Name: iam_session_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX iam_session_status_idx ON business_manager.iam_session USING btree (status);


--
-- Name: iam_session_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_session_userId_idx" ON business_manager.iam_session USING btree ("userId");


--
-- Name: iam_session_userId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_session_userId_status_idx" ON business_manager.iam_session USING btree ("userId", status);


--
-- Name: iam_user_defaultTenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "iam_user_defaultTenantId_idx" ON business_manager.iam_user USING btree ("defaultTenantId");


--
-- Name: iam_user_primaryEmail_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "iam_user_primaryEmail_key" ON business_manager.iam_user USING btree ("primaryEmail");


--
-- Name: iam_user_username_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX iam_user_username_key ON business_manager.iam_user USING btree (username);


--
-- Name: identity_email_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX identity_email_idx ON business_manager.identity USING btree (email);


--
-- Name: identity_phone_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX identity_phone_idx ON business_manager.identity USING btree (phone);


--
-- Name: identity_provider_subject_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX identity_provider_subject_key ON business_manager.identity USING btree (provider, subject);


--
-- Name: identity_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX identity_status_idx ON business_manager.identity USING btree (status);


--
-- Name: identity_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX identity_type_idx ON business_manager.identity USING btree (type);


--
-- Name: integration_logs_connectorId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "integration_logs_connectorId_status_idx" ON business_manager.integration_logs USING btree ("connectorId", status);


--
-- Name: integration_logs_errorCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "integration_logs_errorCode_idx" ON business_manager.integration_logs USING btree ("errorCode");


--
-- Name: integration_logs_startedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "integration_logs_startedAt_idx" ON business_manager.integration_logs USING btree ("startedAt");


--
-- Name: integration_logs_tenantId_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "integration_logs_tenantId_createdAt_idx" ON business_manager.integration_logs USING btree ("tenantId", "createdAt");


--
-- Name: invoice_dueAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "invoice_dueAt_idx" ON business_manager.invoice USING btree ("dueAt");


--
-- Name: invoice_invoiceNumber_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "invoice_invoiceNumber_key" ON business_manager.invoice USING btree ("invoiceNumber");


--
-- Name: invoice_item_invoiceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "invoice_item_invoiceId_idx" ON business_manager.invoice_item USING btree ("invoiceId");


--
-- Name: invoice_item_sourceType_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "invoice_item_sourceType_idx" ON business_manager.invoice_item USING btree ("sourceType");


--
-- Name: invoice_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX invoice_status_idx ON business_manager.invoice USING btree (status);


--
-- Name: invoice_subscriptionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "invoice_subscriptionId_idx" ON business_manager.invoice USING btree ("subscriptionId");


--
-- Name: invoice_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "invoice_tenantId_idx" ON business_manager.invoice USING btree ("tenantId");


--
-- Name: membership_organizationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "membership_organizationId_idx" ON business_manager.membership USING btree ("organizationId");


--
-- Name: membership_siteId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "membership_siteId_idx" ON business_manager.membership USING btree ("siteId");


--
-- Name: membership_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX membership_status_idx ON business_manager.membership USING btree (status);


--
-- Name: membership_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "membership_tenantId_idx" ON business_manager.membership USING btree ("tenantId");


--
-- Name: membership_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "membership_tenantId_status_idx" ON business_manager.membership USING btree ("tenantId", status);


--
-- Name: membership_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "membership_userId_idx" ON business_manager.membership USING btree ("userId");


--
-- Name: meter_entitlementCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "meter_entitlementCode_idx" ON business_manager.meter USING btree ("entitlementCode");


--
-- Name: meter_key_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX meter_key_key ON business_manager.meter USING btree (key);


--
-- Name: meter_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX meter_status_idx ON business_manager.meter USING btree (status);


--
-- Name: mfa_method_enabled_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX mfa_method_enabled_idx ON business_manager.mfa_method USING btree (enabled);


--
-- Name: mfa_method_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX mfa_method_type_idx ON business_manager.mfa_method USING btree (type);


--
-- Name: mfa_method_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "mfa_method_userId_idx" ON business_manager.mfa_method USING btree ("userId");


--
-- Name: organization_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX organization_status_idx ON business_manager.organization USING btree (status);


--
-- Name: organization_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "organization_tenantId_code_key" ON business_manager.organization USING btree ("tenantId", code);


--
-- Name: organization_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "organization_tenantId_idx" ON business_manager.organization USING btree ("tenantId");


--
-- Name: outbox_event_aggregateType_aggregateId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "outbox_event_aggregateType_aggregateId_idx" ON business_manager.outbox_event USING btree ("aggregateType", "aggregateId");


--
-- Name: outbox_event_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "outbox_event_createdAt_idx" ON business_manager.outbox_event USING btree ("createdAt");


--
-- Name: outbox_event_eventType_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "outbox_event_eventType_idx" ON business_manager.outbox_event USING btree ("eventType");


--
-- Name: outbox_event_publishedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "outbox_event_publishedAt_idx" ON business_manager.outbox_event USING btree ("publishedAt");


--
-- Name: payment_attempt_attemptId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "payment_attempt_attemptId_key" ON business_manager.payment_attempt USING btree ("attemptId");


--
-- Name: payment_attempt_paymentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "payment_attempt_paymentId_idx" ON business_manager.payment_attempt USING btree ("paymentId");


--
-- Name: payment_externalReference_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "payment_externalReference_idx" ON business_manager.payment USING btree ("externalReference");


--
-- Name: payment_invoiceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "payment_invoiceId_idx" ON business_manager.payment USING btree ("invoiceId");


--
-- Name: payment_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX payment_status_idx ON business_manager.payment USING btree (status);


--
-- Name: payment_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "payment_tenantId_idx" ON business_manager.payment USING btree ("tenantId");


--
-- Name: permission_active_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX permission_active_idx ON business_manager.permission USING btree (active);


--
-- Name: permission_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX permission_code_key ON business_manager.permission USING btree (code);


--
-- Name: permission_resource_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX permission_resource_action_idx ON business_manager.permission USING btree (resource, action);


--
-- Name: plan_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX plan_code_key ON business_manager.plan USING btree (code);


--
-- Name: plan_entitlement_featureCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "plan_entitlement_featureCode_idx" ON business_manager.plan_entitlement USING btree ("featureCode");


--
-- Name: plan_entitlement_planId_featureCode_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "plan_entitlement_planId_featureCode_key" ON business_manager.plan_entitlement USING btree ("planId", "featureCode");


--
-- Name: plan_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX plan_status_idx ON business_manager.plan USING btree (status);


--
-- Name: platform_diagnostic_checkedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "platform_diagnostic_checkedAt_idx" ON business_manager.platform_diagnostic USING btree ("checkedAt");


--
-- Name: platform_diagnostic_component_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX platform_diagnostic_component_idx ON business_manager.platform_diagnostic USING btree (component);


--
-- Name: platform_diagnostic_serviceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "platform_diagnostic_serviceId_idx" ON business_manager.platform_diagnostic USING btree ("serviceId");


--
-- Name: platform_diagnostic_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX platform_diagnostic_status_idx ON business_manager.platform_diagnostic USING btree (status);


--
-- Name: platform_maintenance_active_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX platform_maintenance_active_idx ON business_manager.platform_maintenance USING btree (active);


--
-- Name: platform_maintenance_environment_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX platform_maintenance_environment_idx ON business_manager.platform_maintenance USING btree (environment);


--
-- Name: platform_maintenance_startsAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "platform_maintenance_startsAt_idx" ON business_manager.platform_maintenance USING btree ("startsAt");


--
-- Name: platform_service_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX platform_service_code_key ON business_manager.platform_service USING btree (code);


--
-- Name: platform_service_environment_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX platform_service_environment_idx ON business_manager.platform_service USING btree (environment);


--
-- Name: platform_service_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX platform_service_status_idx ON business_manager.platform_service USING btree (status);


--
-- Name: pm_capabilities_code_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX pm_capabilities_code_status_idx ON business_manager.pm_capabilities USING btree (code, status);


--
-- Name: pm_capabilities_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_capabilities_tenantId_code_key" ON business_manager.pm_capabilities USING btree ("tenantId", code);


--
-- Name: pm_dependencies_tenantId_packVersionId_resolutionStatus_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_dependencies_tenantId_packVersionId_resolutionStatus_idx" ON business_manager.pm_dependencies USING btree ("tenantId", "packVersionId", "resolutionStatus");


--
-- Name: pm_dependencies_tenantId_packVersionId_sourceType_sourceId__key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_dependencies_tenantId_packVersionId_sourceType_sourceId__key" ON business_manager.pm_dependencies USING btree ("tenantId", "packVersionId", "sourceType", "sourceId", "dependencyType", "targetType", "targetRef");


--
-- Name: pm_feature_capabilities_tenantId_capabilityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_feature_capabilities_tenantId_capabilityId_idx" ON business_manager.pm_feature_capabilities USING btree ("tenantId", "capabilityId");


--
-- Name: pm_feature_capabilities_tenantId_featureId_capabilityId_rel_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_feature_capabilities_tenantId_featureId_capabilityId_rel_key" ON business_manager.pm_feature_capabilities USING btree ("tenantId", "featureId", "capabilityId", "relationType");


--
-- Name: pm_manifests_packVersionId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_manifests_packVersionId_key" ON business_manager.pm_manifests USING btree ("packVersionId");


--
-- Name: pm_manifests_packVersionId_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_manifests_packVersionId_tenantId_key" ON business_manager.pm_manifests USING btree ("packVersionId", "tenantId");


--
-- Name: pm_manifests_tenantId_manifestHash_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_manifests_tenantId_manifestHash_idx" ON business_manager.pm_manifests USING btree ("tenantId", "manifestHash");


--
-- Name: pm_pack_features_id_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_pack_features_id_tenantId_key" ON business_manager.pm_pack_features USING btree (id, "tenantId");


--
-- Name: pm_pack_features_tenantId_moduleId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_pack_features_tenantId_moduleId_idx" ON business_manager.pm_pack_features USING btree ("tenantId", "moduleId");


--
-- Name: pm_pack_features_tenantId_packVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_pack_features_tenantId_packVersionId_code_key" ON business_manager.pm_pack_features USING btree ("tenantId", "packVersionId", code);


--
-- Name: pm_pack_modules_id_packVersionId_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_pack_modules_id_packVersionId_tenantId_key" ON business_manager.pm_pack_modules USING btree (id, "packVersionId", "tenantId");


--
-- Name: pm_pack_modules_tenantId_packVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_pack_modules_tenantId_packVersionId_code_key" ON business_manager.pm_pack_modules USING btree ("tenantId", "packVersionId", code);


--
-- Name: pm_pack_modules_tenantId_packVersionId_displayOrder_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_pack_modules_tenantId_packVersionId_displayOrder_idx" ON business_manager.pm_pack_modules USING btree ("tenantId", "packVersionId", "displayOrder");


--
-- Name: pm_pack_versions_id_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_pack_versions_id_tenantId_key" ON business_manager.pm_pack_versions USING btree (id, "tenantId");


--
-- Name: pm_pack_versions_tenantId_packId_versionNumber_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_pack_versions_tenantId_packId_versionNumber_key" ON business_manager.pm_pack_versions USING btree ("tenantId", "packId", "versionNumber");


--
-- Name: pm_pack_versions_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_pack_versions_tenantId_status_idx" ON business_manager.pm_pack_versions USING btree ("tenantId", status);


--
-- Name: pm_packs_id_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_packs_id_tenantId_key" ON business_manager.pm_packs USING btree (id, "tenantId");


--
-- Name: pm_packs_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_packs_tenantId_code_key" ON business_manager.pm_packs USING btree ("tenantId", code);


--
-- Name: pm_packs_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_packs_tenantId_status_idx" ON business_manager.pm_packs USING btree ("tenantId", status);


--
-- Name: pm_rules_tenantId_packVersionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_rules_tenantId_packVersionId_code_key" ON business_manager.pm_rules USING btree ("tenantId", "packVersionId", code);


--
-- Name: pm_rules_tenantId_packVersionId_enabled_priority_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_rules_tenantId_packVersionId_enabled_priority_idx" ON business_manager.pm_rules USING btree ("tenantId", "packVersionId", enabled, priority);


--
-- Name: pm_snapshots_packVersionId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_snapshots_packVersionId_key" ON business_manager.pm_snapshots USING btree ("packVersionId");


--
-- Name: pm_snapshots_packVersionId_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pm_snapshots_packVersionId_tenantId_key" ON business_manager.pm_snapshots USING btree ("packVersionId", "tenantId");


--
-- Name: pm_snapshots_tenantId_snapshotHash_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_snapshots_tenantId_snapshotHash_idx" ON business_manager.pm_snapshots USING btree ("tenantId", "snapshotHash");


--
-- Name: pm_validations_tenantId_packVersionId_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pm_validations_tenantId_packVersionId_createdAt_idx" ON business_manager.pm_validations USING btree ("tenantId", "packVersionId", "createdAt");


--
-- Name: policy_condition_attribute_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX policy_condition_attribute_idx ON business_manager.policy_condition USING btree (attribute);


--
-- Name: policy_condition_policyId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "policy_condition_policyId_idx" ON business_manager.policy_condition USING btree ("policyId");


--
-- Name: pr_effective_manifests_manifestHash_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pr_effective_manifests_manifestHash_idx" ON business_manager.pr_effective_manifests USING btree ("manifestHash");


--
-- Name: pr_effective_manifests_resolutionId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pr_effective_manifests_resolutionId_key" ON business_manager.pr_effective_manifests USING btree ("resolutionId");


--
-- Name: pr_effective_manifests_resolutionId_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pr_effective_manifests_resolutionId_tenantId_key" ON business_manager.pr_effective_manifests USING btree ("resolutionId", "tenantId");


--
-- Name: pr_effective_manifests_tenantId_applicationId_environment_c_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pr_effective_manifests_tenantId_applicationId_environment_c_idx" ON business_manager.pr_effective_manifests USING btree ("tenantId", "applicationId", environment, "createdAt");


--
-- Name: pr_runtime_diagnostics_tenantId_resolutionId_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pr_runtime_diagnostics_tenantId_resolutionId_createdAt_idx" ON business_manager.pr_runtime_diagnostics USING btree ("tenantId", "resolutionId", "createdAt");


--
-- Name: pr_runtime_diagnostics_tenantId_severity_category_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pr_runtime_diagnostics_tenantId_severity_category_idx" ON business_manager.pr_runtime_diagnostics USING btree ("tenantId", severity, category);


--
-- Name: pr_runtime_resolution_steps_resolutionId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pr_runtime_resolution_steps_resolutionId_code_key" ON business_manager.pr_runtime_resolution_steps USING btree ("resolutionId", code);


--
-- Name: pr_runtime_resolution_steps_resolutionId_displayOrder_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pr_runtime_resolution_steps_resolutionId_displayOrder_idx" ON business_manager.pr_runtime_resolution_steps USING btree ("resolutionId", "displayOrder");


--
-- Name: pr_runtime_resolutions_id_tenantId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pr_runtime_resolutions_id_tenantId_key" ON business_manager.pr_runtime_resolutions USING btree (id, "tenantId");


--
-- Name: pr_runtime_resolutions_tenantId_applicationId_environment_s_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "pr_runtime_resolutions_tenantId_applicationId_environment_s_idx" ON business_manager.pr_runtime_resolutions USING btree ("tenantId", "applicationId", environment, "startedAt");


--
-- Name: pr_runtime_resolutions_tenantId_requestHash_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "pr_runtime_resolutions_tenantId_requestHash_key" ON business_manager.pr_runtime_resolutions USING btree ("tenantId", "requestHash");


--
-- Name: quota_usage_featureCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "quota_usage_featureCode_idx" ON business_manager.quota_usage USING btree ("featureCode");


--
-- Name: quota_usage_subscriptionId_featureCode_periodStart_periodEn_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "quota_usage_subscriptionId_featureCode_periodStart_periodEn_key" ON business_manager.quota_usage USING btree ("subscriptionId", "featureCode", "periodStart", "periodEnd");


--
-- Name: quota_usage_subscriptionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "quota_usage_subscriptionId_idx" ON business_manager.quota_usage USING btree ("subscriptionId");


--
-- Name: recovery_code_codeHash_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "recovery_code_codeHash_key" ON business_manager.recovery_code USING btree ("codeHash");


--
-- Name: recovery_code_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "recovery_code_userId_idx" ON business_manager.recovery_code USING btree ("userId");


--
-- Name: releases_applicationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "releases_applicationId_idx" ON business_manager.releases USING btree ("applicationId");


--
-- Name: releases_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "releases_applicationVersionId_idx" ON business_manager.releases USING btree ("applicationVersionId");


--
-- Name: releases_code_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX releases_code_version_key ON business_manager.releases USING btree (code, version);


--
-- Name: releases_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "releases_createdAt_idx" ON business_manager.releases USING btree ("createdAt");


--
-- Name: releases_snapshotId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "releases_snapshotId_idx" ON business_manager.releases USING btree ("snapshotId");


--
-- Name: releases_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX releases_status_idx ON business_manager.releases USING btree (status);


--
-- Name: releases_tenantId_code_version_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "releases_tenantId_code_version_key" ON business_manager.releases USING btree ("tenantId", code, version);


--
-- Name: releases_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "releases_tenantId_idx" ON business_manager.releases USING btree ("tenantId");


--
-- Name: role_assignment_groupId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_groupId_idx" ON business_manager.role_assignment USING btree ("groupId");


--
-- Name: role_assignment_organizationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_organizationId_idx" ON business_manager.role_assignment USING btree ("organizationId");


--
-- Name: role_assignment_roleId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_roleId_idx" ON business_manager.role_assignment USING btree ("roleId");


--
-- Name: role_assignment_serviceAccountId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_serviceAccountId_idx" ON business_manager.role_assignment USING btree ("serviceAccountId");


--
-- Name: role_assignment_siteId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_siteId_idx" ON business_manager.role_assignment USING btree ("siteId");


--
-- Name: role_assignment_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_tenantId_idx" ON business_manager.role_assignment USING btree ("tenantId");


--
-- Name: role_assignment_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_assignment_userId_idx" ON business_manager.role_assignment USING btree ("userId");


--
-- Name: role_permission_permissionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_permission_permissionId_idx" ON business_manager.role_permission USING btree ("permissionId");


--
-- Name: role_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX role_status_idx ON business_manager.role USING btree (status);


--
-- Name: role_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "role_tenantId_code_key" ON business_manager.role USING btree ("tenantId", code);


--
-- Name: role_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "role_tenantId_idx" ON business_manager.role USING btree ("tenantId");


--
-- Name: rollbacks_deploymentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "rollbacks_deploymentId_idx" ON business_manager.rollbacks USING btree ("deploymentId");


--
-- Name: rollbacks_fromReleaseId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "rollbacks_fromReleaseId_idx" ON business_manager.rollbacks USING btree ("fromReleaseId");


--
-- Name: rollbacks_startedAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "rollbacks_startedAt_idx" ON business_manager.rollbacks USING btree ("startedAt");


--
-- Name: rollbacks_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX rollbacks_status_idx ON business_manager.rollbacks USING btree (status);


--
-- Name: rollbacks_toReleaseId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "rollbacks_toReleaseId_idx" ON business_manager.rollbacks USING btree ("toReleaseId");


--
-- Name: rollbacks_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "rollbacks_traceId_idx" ON business_manager.rollbacks USING btree ("traceId");


--
-- Name: rollbacks_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX rollbacks_type_idx ON business_manager.rollbacks USING btree (type);


--
-- Name: security_event_occurredAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "security_event_occurredAt_idx" ON business_manager.security_event USING btree ("occurredAt");


--
-- Name: security_event_severity_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX security_event_severity_idx ON business_manager.security_event USING btree (severity);


--
-- Name: security_event_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "security_event_tenantId_idx" ON business_manager.security_event USING btree ("tenantId");


--
-- Name: security_event_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "security_event_traceId_idx" ON business_manager.security_event USING btree ("traceId");


--
-- Name: security_event_type_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX security_event_type_idx ON business_manager.security_event USING btree (type);


--
-- Name: security_event_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "security_event_userId_idx" ON business_manager.security_event USING btree ("userId");


--
-- Name: service_account_credential_keyId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "service_account_credential_keyId_key" ON business_manager.service_account_credential USING btree ("keyId");


--
-- Name: service_account_credential_serviceAccountId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "service_account_credential_serviceAccountId_idx" ON business_manager.service_account_credential USING btree ("serviceAccountId");


--
-- Name: service_account_credential_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX service_account_credential_status_idx ON business_manager.service_account_credential USING btree (status);


--
-- Name: service_account_identityId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "service_account_identityId_key" ON business_manager.service_account USING btree ("identityId");


--
-- Name: service_account_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX service_account_status_idx ON business_manager.service_account USING btree (status);


--
-- Name: service_account_tenantId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "service_account_tenantId_code_key" ON business_manager.service_account USING btree ("tenantId", code);


--
-- Name: service_account_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "service_account_tenantId_idx" ON business_manager.service_account USING btree ("tenantId");


--
-- Name: site_organizationId_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "site_organizationId_code_key" ON business_manager.site USING btree ("organizationId", code);


--
-- Name: site_organizationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "site_organizationId_idx" ON business_manager.site USING btree ("organizationId");


--
-- Name: site_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX site_status_idx ON business_manager.site USING btree (status);


--
-- Name: snapshot_history_action_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX snapshot_history_action_idx ON business_manager.snapshot_history USING btree (action);


--
-- Name: snapshot_history_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshot_history_createdAt_idx" ON business_manager.snapshot_history USING btree ("createdAt");


--
-- Name: snapshot_history_snapshotId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshot_history_snapshotId_idx" ON business_manager.snapshot_history USING btree ("snapshotId");


--
-- Name: snapshot_history_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshot_history_tenantId_idx" ON business_manager.snapshot_history USING btree ("tenantId");


--
-- Name: snapshots_applicationId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshots_applicationId_idx" ON business_manager.snapshots USING btree ("applicationId");


--
-- Name: snapshots_applicationVersionId_environmentId_hash_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "snapshots_applicationVersionId_environmentId_hash_key" ON business_manager.snapshots USING btree ("applicationVersionId", "environmentId", hash);


--
-- Name: snapshots_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshots_applicationVersionId_idx" ON business_manager.snapshots USING btree ("applicationVersionId");


--
-- Name: snapshots_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshots_createdAt_idx" ON business_manager.snapshots USING btree ("createdAt");


--
-- Name: snapshots_environmentId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshots_environmentId_idx" ON business_manager.snapshots USING btree ("environmentId");


--
-- Name: snapshots_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX snapshots_status_idx ON business_manager.snapshots USING btree (status);


--
-- Name: snapshots_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshots_tenantId_idx" ON business_manager.snapshots USING btree ("tenantId");


--
-- Name: snapshots_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "snapshots_tenantId_status_idx" ON business_manager.snapshots USING btree ("tenantId", status);


--
-- Name: subscription_currentPeriodEnd_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "subscription_currentPeriodEnd_idx" ON business_manager.subscription USING btree ("currentPeriodEnd");


--
-- Name: subscription_entitlement_override_featureCode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "subscription_entitlement_override_featureCode_idx" ON business_manager.subscription_entitlement_override USING btree ("featureCode");


--
-- Name: subscription_entitlement_override_subscriptionId_featureCod_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "subscription_entitlement_override_subscriptionId_featureCod_key" ON business_manager.subscription_entitlement_override USING btree ("subscriptionId", "featureCode");


--
-- Name: subscription_nextBillingAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "subscription_nextBillingAt_idx" ON business_manager.subscription USING btree ("nextBillingAt");


--
-- Name: subscription_planId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "subscription_planId_idx" ON business_manager.subscription USING btree ("planId");


--
-- Name: subscription_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX subscription_status_idx ON business_manager.subscription USING btree (status);


--
-- Name: subscription_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "subscription_tenantId_idx" ON business_manager.subscription USING btree ("tenantId");


--
-- Name: subscription_tenantId_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "subscription_tenantId_status_idx" ON business_manager.subscription USING btree ("tenantId", status);


--
-- Name: synchronizations_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX synchronizations_code_key ON business_manager.synchronizations USING btree (code);


--
-- Name: synchronizations_connectorId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "synchronizations_connectorId_idx" ON business_manager.synchronizations USING btree ("connectorId");


--
-- Name: synchronizations_direction_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX synchronizations_direction_idx ON business_manager.synchronizations USING btree (direction);


--
-- Name: synchronizations_mode_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX synchronizations_mode_idx ON business_manager.synchronizations USING btree (mode);


--
-- Name: synchronizations_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX synchronizations_status_idx ON business_manager.synchronizations USING btree (status);


--
-- Name: tenant_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX tenant_code_key ON business_manager.tenant USING btree (code);


--
-- Name: tenant_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX tenant_status_idx ON business_manager.tenant USING btree (status);


--
-- Name: ui_pages_applicationVersionId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "ui_pages_applicationVersionId_idx" ON business_manager.ui_pages USING btree ("applicationVersionId");


--
-- Name: ui_pages_route_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX ui_pages_route_idx ON business_manager.ui_pages USING btree (route);


--
-- Name: ui_pages_tenantId_applicationVersionId_key_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "ui_pages_tenantId_applicationVersionId_key_key" ON business_manager.ui_pages USING btree ("tenantId", "applicationVersionId", key);


--
-- Name: ui_pages_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "ui_pages_tenantId_idx" ON business_manager.ui_pages USING btree ("tenantId");


--
-- Name: ui_theme_settings_applicationVersionId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "ui_theme_settings_applicationVersionId_key" ON business_manager.ui_theme_settings USING btree ("applicationVersionId");


--
-- Name: ui_theme_settings_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "ui_theme_settings_tenantId_idx" ON business_manager.ui_theme_settings USING btree ("tenantId");


--
-- Name: usage_aggregate_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "usage_aggregate_tenantId_idx" ON business_manager.usage_aggregate USING btree ("tenantId");


--
-- Name: usage_aggregate_tenantId_meterKey_periodStart_periodEnd_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "usage_aggregate_tenantId_meterKey_periodStart_periodEnd_key" ON business_manager.usage_aggregate USING btree ("tenantId", "meterKey", "periodStart", "periodEnd");


--
-- Name: usage_event_eventId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "usage_event_eventId_key" ON business_manager.usage_event USING btree ("eventId");


--
-- Name: usage_event_meterKey_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "usage_event_meterKey_idx" ON business_manager.usage_event USING btree ("meterKey");


--
-- Name: usage_event_tenantId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "usage_event_tenantId_idx" ON business_manager.usage_event USING btree ("tenantId");


--
-- Name: usage_event_tenantId_meterKey_occurredAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "usage_event_tenantId_meterKey_occurredAt_idx" ON business_manager.usage_event USING btree ("tenantId", "meterKey", "occurredAt");


--
-- Name: user_identity_identityId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "user_identity_identityId_idx" ON business_manager.user_identity USING btree ("identityId");


--
-- Name: user_identity_userId_identityId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "user_identity_userId_identityId_key" ON business_manager.user_identity USING btree ("userId", "identityId");


--
-- Name: user_identity_userId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "user_identity_userId_idx" ON business_manager.user_identity USING btree ("userId");


--
-- Name: webhook_deliveries_createdAt_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "webhook_deliveries_createdAt_idx" ON business_manager.webhook_deliveries USING btree ("createdAt");


--
-- Name: webhook_deliveries_eventId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "webhook_deliveries_eventId_idx" ON business_manager.webhook_deliveries USING btree ("eventId");


--
-- Name: webhook_deliveries_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX webhook_deliveries_status_idx ON business_manager.webhook_deliveries USING btree (status);


--
-- Name: webhook_deliveries_traceId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "webhook_deliveries_traceId_idx" ON business_manager.webhook_deliveries USING btree ("traceId");


--
-- Name: webhook_deliveries_webhookId_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX "webhook_deliveries_webhookId_idx" ON business_manager.webhook_deliveries USING btree ("webhookId");


--
-- Name: webhook_event_providerEventId_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX "webhook_event_providerEventId_key" ON business_manager.webhook_event USING btree ("providerEventId");


--
-- Name: webhook_event_provider_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX webhook_event_provider_idx ON business_manager.webhook_event USING btree (provider);


--
-- Name: webhooks_code_key; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE UNIQUE INDEX webhooks_code_key ON business_manager.webhooks USING btree (code);


--
-- Name: webhooks_direction_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX webhooks_direction_idx ON business_manager.webhooks USING btree (direction);


--
-- Name: webhooks_event_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX webhooks_event_idx ON business_manager.webhooks USING btree (event);


--
-- Name: webhooks_status_idx; Type: INDEX; Schema: business_manager; Owner: -
--

CREATE INDEX webhooks_status_idx ON business_manager.webhooks USING btree (status);


--
-- Name: access_policy access_policy_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.access_policy
    ADD CONSTRAINT "access_policy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_delegation admin_delegation_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.admin_delegation
    ADD CONSTRAINT "admin_delegation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: application_versions application_versions_applicationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.application_versions
    ADD CONSTRAINT "application_versions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES business_manager.applications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bm_capability_dependencies bm_capability_dependencies_capabilityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_capability_dependencies
    ADD CONSTRAINT "bm_capability_dependencies_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES business_manager.bm_feature_capabilities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_computed_fields bm_computed_fields_entityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_computed_fields
    ADD CONSTRAINT "bm_computed_fields_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES business_manager.bm_entities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_constraints bm_constraints_entityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_constraints
    ADD CONSTRAINT "bm_constraints_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES business_manager.bm_entities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_constraints bm_constraints_fieldId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_constraints
    ADD CONSTRAINT "bm_constraints_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES business_manager.bm_fields(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bm_contract_versions bm_contract_versions_contractId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_contract_versions
    ADD CONSTRAINT "bm_contract_versions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES business_manager.bm_contracts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_feature_capabilities bm_feature_capabilities_featureId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_feature_capabilities
    ADD CONSTRAINT "bm_feature_capabilities_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES business_manager.bm_features(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_field_validations bm_field_validations_fieldId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_field_validations
    ADD CONSTRAINT "bm_field_validations_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES business_manager.bm_fields(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_fields bm_fields_entityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_fields
    ADD CONSTRAINT "bm_fields_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES business_manager.bm_entities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_index_fields bm_index_fields_indexId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_index_fields
    ADD CONSTRAINT "bm_index_fields_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES business_manager.bm_indexes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_indexes bm_indexes_entityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_indexes
    ADD CONSTRAINT "bm_indexes_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES business_manager.bm_entities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_navigation_items bm_navigation_items_menuId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_navigation_items
    ADD CONSTRAINT "bm_navigation_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES business_manager.bm_menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_navigation_items bm_navigation_items_parentItemId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_navigation_items
    ADD CONSTRAINT "bm_navigation_items_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES business_manager.bm_navigation_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bm_quality_issues bm_quality_issues_reportId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_issues
    ADD CONSTRAINT "bm_quality_issues_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES business_manager.bm_quality_reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_quality_issues bm_quality_issues_runId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_issues
    ADD CONSTRAINT "bm_quality_issues_runId_fkey" FOREIGN KEY ("runId") REFERENCES business_manager.bm_validation_runs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_quality_metrics bm_quality_metrics_reportId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_quality_metrics
    ADD CONSTRAINT "bm_quality_metrics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES business_manager.bm_quality_reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_runtime_bindings bm_runtime_bindings_manifestId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_runtime_bindings
    ADD CONSTRAINT "bm_runtime_bindings_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES business_manager.bm_runtime_manifests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_test_cases bm_test_cases_suiteId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_test_cases
    ADD CONSTRAINT "bm_test_cases_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES business_manager.bm_test_suites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_test_runs bm_test_runs_testCaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_test_runs
    ADD CONSTRAINT "bm_test_runs_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES business_manager.bm_test_cases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bm_validation_runs bm_validation_runs_campaignId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.bm_validation_runs
    ADD CONSTRAINT "bm_validation_runs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES business_manager.bm_validation_campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: configuration_history configuration_history_configurationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.configuration_history
    ADD CONSTRAINT "configuration_history_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES business_manager.configurations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contract_consumers contract_consumers_contractId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contract_consumers
    ADD CONSTRAINT "contract_consumers_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES business_manager.contracts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contract_history contract_history_contractId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contract_history
    ADD CONSTRAINT "contract_history_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES business_manager.contracts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contract_providers contract_providers_contractId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.contract_providers
    ADD CONSTRAINT "contract_providers_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES business_manager.contracts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployment_gates deployment_gates_deploymentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_gates
    ADD CONSTRAINT "deployment_gates_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES business_manager.deployments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployment_history deployment_history_applicationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_history
    ADD CONSTRAINT "deployment_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES business_manager.applications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deployment_history deployment_history_deploymentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_history
    ADD CONSTRAINT "deployment_history_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES business_manager.deployments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deployment_history deployment_history_environmentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_history
    ADD CONSTRAINT "deployment_history_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES business_manager.environments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deployment_history deployment_history_releaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployment_history
    ADD CONSTRAINT "deployment_history_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES business_manager.releases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deployments deployments_environmentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployments
    ADD CONSTRAINT "deployments_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES business_manager.environments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deployments deployments_releaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.deployments
    ADD CONSTRAINT "deployments_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES business_manager.releases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: entity_mapping entity_mapping_erp_id_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.entity_mapping
    ADD CONSTRAINT entity_mapping_erp_id_fkey FOREIGN KEY (erp_id) REFERENCES business_manager.erp_registry(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: environment_deployments environment_deployments_applicationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_deployments
    ADD CONSTRAINT "environment_deployments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES business_manager.applications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: environment_deployments environment_deployments_currentReleaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_deployments
    ADD CONSTRAINT "environment_deployments_currentReleaseId_fkey" FOREIGN KEY ("currentReleaseId") REFERENCES business_manager.releases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: environment_deployments environment_deployments_deploymentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_deployments
    ADD CONSTRAINT "environment_deployments_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES business_manager.deployments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: environment_deployments environment_deployments_environmentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_deployments
    ADD CONSTRAINT "environment_deployments_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES business_manager.environments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: environment_deployments environment_deployments_previousReleaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_deployments
    ADD CONSTRAINT "environment_deployments_previousReleaseId_fkey" FOREIGN KEY ("previousReleaseId") REFERENCES business_manager.releases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: environment_history environment_history_environmentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.environment_history
    ADD CONSTRAINT "environment_history_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES business_manager.environments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: external_identity_link external_identity_link_identityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.external_identity_link
    ADD CONSTRAINT "external_identity_link_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES business_manager.identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_member group_member_groupId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.group_member
    ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES business_manager.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_member group_member_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.group_member
    ADD CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.groups
    ADD CONSTRAINT "groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES business_manager.organization(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: groups groups_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.groups
    ADD CONSTRAINT "groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: iam_credential iam_credential_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_credential
    ADD CONSTRAINT "iam_credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: iam_device iam_device_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_device
    ADD CONSTRAINT "iam_device_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: iam_password_history iam_password_history_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_password_history
    ADD CONSTRAINT "iam_password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: iam_refresh_token iam_refresh_token_sessionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_refresh_token
    ADD CONSTRAINT "iam_refresh_token_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES business_manager.iam_session(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: iam_session iam_session_deviceId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_session
    ADD CONSTRAINT "iam_session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES business_manager.iam_device(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: iam_session iam_session_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_session
    ADD CONSTRAINT "iam_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: iam_user iam_user_defaultTenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.iam_user
    ADD CONSTRAINT "iam_user_defaultTenantId_fkey" FOREIGN KEY ("defaultTenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: integration_logs integration_logs_connectorId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.integration_logs
    ADD CONSTRAINT "integration_logs_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES business_manager.connectors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_item invoice_item_invoiceId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.invoice_item
    ADD CONSTRAINT "invoice_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES business_manager.invoice(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice invoice_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.invoice
    ADD CONSTRAINT "invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES business_manager.subscription(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice invoice_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.invoice
    ADD CONSTRAINT "invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membership membership_organizationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.membership
    ADD CONSTRAINT "membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES business_manager.organization(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: membership membership_siteId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.membership
    ADD CONSTRAINT "membership_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES business_manager.site(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: membership membership_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.membership
    ADD CONSTRAINT "membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membership membership_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.membership
    ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mfa_method mfa_method_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.mfa_method
    ADD CONSTRAINT "mfa_method_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization organization_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.organization
    ADD CONSTRAINT "organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment payment_invoiceId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.payment
    ADD CONSTRAINT "payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES business_manager.invoice(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plan_entitlement plan_entitlement_planId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.plan_entitlement
    ADD CONSTRAINT "plan_entitlement_planId_fkey" FOREIGN KEY ("planId") REFERENCES business_manager.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: platform_diagnostic platform_diagnostic_serviceId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.platform_diagnostic
    ADD CONSTRAINT "platform_diagnostic_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES business_manager.platform_service(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pm_dependencies pm_dependencies_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_dependencies
    ADD CONSTRAINT "pm_dependencies_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_feature_capabilities pm_feature_capabilities_capabilityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_feature_capabilities
    ADD CONSTRAINT "pm_feature_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES business_manager.pm_capabilities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pm_feature_capabilities pm_feature_capabilities_featureId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_feature_capabilities
    ADD CONSTRAINT "pm_feature_capabilities_featureId_tenantId_fkey" FOREIGN KEY ("featureId", "tenantId") REFERENCES business_manager.pm_pack_features(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_manifests pm_manifests_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_manifests
    ADD CONSTRAINT "pm_manifests_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_pack_features pm_pack_features_moduleId_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_features
    ADD CONSTRAINT "pm_pack_features_moduleId_packVersionId_tenantId_fkey" FOREIGN KEY ("moduleId", "packVersionId", "tenantId") REFERENCES business_manager.pm_pack_modules(id, "packVersionId", "tenantId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pm_pack_features pm_pack_features_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_features
    ADD CONSTRAINT "pm_pack_features_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_pack_modules pm_pack_modules_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_modules
    ADD CONSTRAINT "pm_pack_modules_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_pack_versions pm_pack_versions_packId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_pack_versions
    ADD CONSTRAINT "pm_pack_versions_packId_tenantId_fkey" FOREIGN KEY ("packId", "tenantId") REFERENCES business_manager.pm_packs(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_rules pm_rules_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_rules
    ADD CONSTRAINT "pm_rules_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_snapshots pm_snapshots_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_snapshots
    ADD CONSTRAINT "pm_snapshots_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pm_validations pm_validations_packVersionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pm_validations
    ADD CONSTRAINT "pm_validations_packVersionId_tenantId_fkey" FOREIGN KEY ("packVersionId", "tenantId") REFERENCES business_manager.pm_pack_versions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: policy_condition policy_condition_policyId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.policy_condition
    ADD CONSTRAINT "policy_condition_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES business_manager.access_policy(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pr_effective_manifests pr_effective_manifests_resolutionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_effective_manifests
    ADD CONSTRAINT "pr_effective_manifests_resolutionId_tenantId_fkey" FOREIGN KEY ("resolutionId", "tenantId") REFERENCES business_manager.pr_runtime_resolutions(id, "tenantId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pr_runtime_diagnostics pr_runtime_diagnostics_resolutionId_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_runtime_diagnostics
    ADD CONSTRAINT "pr_runtime_diagnostics_resolutionId_tenantId_fkey" FOREIGN KEY ("resolutionId", "tenantId") REFERENCES business_manager.pr_runtime_resolutions(id, "tenantId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pr_runtime_resolution_steps pr_runtime_resolution_steps_resolutionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.pr_runtime_resolution_steps
    ADD CONSTRAINT "pr_runtime_resolution_steps_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES business_manager.pr_runtime_resolutions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quota_usage quota_usage_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.quota_usage
    ADD CONSTRAINT "quota_usage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES business_manager.subscription(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recovery_code recovery_code_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.recovery_code
    ADD CONSTRAINT "recovery_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: releases releases_applicationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.releases
    ADD CONSTRAINT "releases_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES business_manager.applications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: releases releases_applicationVersionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.releases
    ADD CONSTRAINT "releases_applicationVersionId_fkey" FOREIGN KEY ("applicationVersionId") REFERENCES business_manager.application_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: releases releases_snapshotId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.releases
    ADD CONSTRAINT "releases_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES business_manager.snapshots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_assignment role_assignment_groupId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_assignment
    ADD CONSTRAINT "role_assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES business_manager.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_assignment role_assignment_roleId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_assignment
    ADD CONSTRAINT "role_assignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES business_manager.role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_assignment role_assignment_serviceAccountId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_assignment
    ADD CONSTRAINT "role_assignment_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES business_manager.service_account(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_assignment role_assignment_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_assignment
    ADD CONSTRAINT "role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permission role_permission_permissionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_permission
    ADD CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES business_manager.permission(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permission role_permission_roleId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role_permission
    ADD CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES business_manager.role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role role_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.role
    ADD CONSTRAINT "role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rollbacks rollbacks_deploymentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.rollbacks
    ADD CONSTRAINT "rollbacks_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES business_manager.deployments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rollbacks rollbacks_fromReleaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.rollbacks
    ADD CONSTRAINT "rollbacks_fromReleaseId_fkey" FOREIGN KEY ("fromReleaseId") REFERENCES business_manager.releases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rollbacks rollbacks_toReleaseId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.rollbacks
    ADD CONSTRAINT "rollbacks_toReleaseId_fkey" FOREIGN KEY ("toReleaseId") REFERENCES business_manager.releases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_account_credential service_account_credential_serviceAccountId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.service_account_credential
    ADD CONSTRAINT "service_account_credential_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES business_manager.service_account(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_account service_account_identityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.service_account
    ADD CONSTRAINT "service_account_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES business_manager.identity(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_account service_account_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.service_account
    ADD CONSTRAINT "service_account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: site site_organizationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.site
    ADD CONSTRAINT "site_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES business_manager.organization(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: snapshot_history snapshot_history_snapshotId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.snapshot_history
    ADD CONSTRAINT "snapshot_history_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES business_manager.snapshots(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: snapshots snapshots_applicationId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.snapshots
    ADD CONSTRAINT "snapshots_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES business_manager.applications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: snapshots snapshots_applicationVersionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.snapshots
    ADD CONSTRAINT "snapshots_applicationVersionId_fkey" FOREIGN KEY ("applicationVersionId") REFERENCES business_manager.application_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: snapshots snapshots_environmentId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.snapshots
    ADD CONSTRAINT "snapshots_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES business_manager.environments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscription_entitlement_override subscription_entitlement_override_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.subscription_entitlement_override
    ADD CONSTRAINT "subscription_entitlement_override_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES business_manager.subscription(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription subscription_planId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.subscription
    ADD CONSTRAINT "subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES business_manager.plan(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscription subscription_tenantId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.subscription
    ADD CONSTRAINT "subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES business_manager.tenant(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: synchronizations synchronizations_connectorId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.synchronizations
    ADD CONSTRAINT "synchronizations_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES business_manager.connectors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_identity user_identity_identityId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.user_identity
    ADD CONSTRAINT "user_identity_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES business_manager.identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_identity user_identity_userId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.user_identity
    ADD CONSTRAINT "user_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES business_manager.iam_user(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_webhookId_fkey; Type: FK CONSTRAINT; Schema: business_manager; Owner: -
--

ALTER TABLE ONLY business_manager.webhook_deliveries
    ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES business_manager.webhooks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


