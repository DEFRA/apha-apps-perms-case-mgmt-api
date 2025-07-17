import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'

import { convictValidateMongoUri } from './common/helpers/convict/validate-mongo-uri.js'

convict.addFormat(convictValidateMongoUri)
convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 3001,
    env: 'PORT'
  },
  serviceName: {
    doc: 'Api Service Name',
    format: String,
    default: 'apha-apps-perms-case-mgmt-api'
  },
  cdpEnvironment: {
    doc: 'The CDP environment the app is running in. With the addition of "local" for local development',
    format: [
      'local',
      'infra-dev',
      'management',
      'dev',
      'test',
      'perf-test',
      'ext-test',
      'prod'
    ],
    default: 'local',
    env: 'ENVIRONMENT'
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  log: {
    isEnabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: !isTest,
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : ['req', 'res', 'responseTime']
    }
  },
  mongo: {
    uri: {
      doc: 'URI for mongodb',
      format: String,
      default: 'mongodb://127.0.0.1:27017',
      env: 'MONGO_URI'
    },
    databaseName: {
      doc: 'Database name for mongodb',
      format: String,
      default: 'apha-apps-perms-case-mgmt-api',
      env: 'MONGO_DATABASE'
    }
  },
  httpProxy: {
    doc: 'HTTP Proxy URL',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  },
  isSecureContextEnabled: {
    doc: 'Enable Secure Context',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_SECURE_CONTEXT'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  tracing: {
    header: {
      doc: 'CDP tracing header name',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  notify: {
    url: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default:
        'https://api.notifications.service.gov.uk/v2/notifications/email',
      nullable: false,
      env: 'NOTIFY_URL'
    },
    apiKey: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'NOTIFY_API_KEY'
    },
    timeout: {
      doc: 'Timeout for notify requests in milliseconds',
      format: Number,
      default: 10_000,
      env: 'NOTIFY_TIMEOUT'
    },
    fileRetention: {
      doc: 'How long to retain files for in GOV Notify',
      format: String,
      default: '1 week',
      env: 'NOTIFY_FILE_RETENTION'
    },
    confirmDownloadConfirmation: {
      doc: 'Does the user have to type destination email address before download starts?',
      format: Boolean,
      default: false,
      env: 'NOTIFY_EMAIL_DOWNLOAD_CONFIRMATION'
    },
    caseDelivery: {
      tb: {
        templateId: /** @type {SchemaObj<string | null>} */ {
          format: String,
          default: null,
          nullable: true,
          env: 'NOTIFY_CASE_DELIVERY_TEMPLATE_ID'
        },
        emailAddress: /** @type {SchemaObj<string | null>} */ {
          format: String,
          default: null,
          nullable: true,
          env: 'NOTIFY_CASE_DELIVERY_EMAIL_ADDRESS'
        }
      },
      exotics: {
        templateId: /** @type {SchemaObj<string | null>} */ {
          format: String,
          default: null,
          nullable: true,
          env: 'EXOTICS_NOTIFY_CASE_DELIVERY_TEMPLATE_ID'
        },
        emailAddress: /** @type {SchemaObj<string | null>} */ {
          format: String,
          default: null,
          nullable: true,
          env: 'EXOTICS_NOTIFY_CASE_DELIVERY_EMAIL_ADDRESS'
        }
      }
    },
    applicantConfirmation: {
      templateId: /** @type {SchemaObj<string | null>} */ {
        format: String,
        default: null,
        nullable: true,
        env: 'NOTIFY_APPLICANT_CONFIRMATION_TEMPLATE_ID'
      }
    }
  },
  aws: {
    region: {
      doc: 'AWS region to use',
      format: String,
      default: 'eu-west-2',
      env: 'AWS_REGION'
    },
    s3Endpoint: {
      doc: 'AWS S3 endpoint',
      format: String,
      default: 'http://127.0.0.1:4566',
      env: 'S3_ENDPOINT'
    },
    bucket: {
      format: String,
      default: null,
      nullable: true,
      env: 'S3_BUCKET'
    },
    sqsEndpoint: {
      doc: 'AWS SQS endpoint',
      format: String,
      default: 'http://localhost:4567',
      env: 'SQS_ENDPOINT'
    },
    sqsQueueUrl: {
      doc: 'AWS SQS queue URL',
      format: String,
      default:
        'http://localhost:4567/000000000000/apha_apps_perms_submitted_applications',
      env: 'SQS_QUEUE_URL'
    },
    accessKeyId: {
      doc: 'AWS access key ID',
      format: String,
      default: 'test',
      env: 'AWS_ACCESS_KEY_ID'
    },
    secretAccessKey: {
      doc: 'AWS secret access key',
      format: String,
      default: 'test',
      env: 'AWS_SECRET'
    }
  },
  gsPath: {
    doc: 'Path of the Ghostscript binary',
    format: String,
    default: '/usr/bin/gs',
    env: 'GS_BINARY'
  },
  featureFlags: {
    sharepointIntegrationEnabled: {
      doc: 'Feature flag to enable the SharePoint integration',
      format: Boolean,
      default: !isProduction,
      env: 'SHAREPOINT_TB25_INTEGRATION_ENABLED'
    },
    stubMode: {
      doc: 'Feature flag to enable a stub mode',
      format: Boolean,
      default: false,
      env: 'STUB_MODE_ENABLED'
    }
  },
  sharepoint: {
    tenantId: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_TENANT_ID'
    },
    clientId: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_CLIENT_ID'
    },
    clientSecret: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_CLIENT_SECRET'
    },
    siteId: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_SITE_ID'
    },
    siteName: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_SITE_NAME'
    },
    siteBaseUrl: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_SITE_BASE_URL'
    },
    listId: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_LIST_ID'
    },
    driveId: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: null,
      nullable: true,
      env: 'SHAREPOINT_TB25_DRIVE_ID'
    },
    folderPath: /** @type {SchemaObj<string | null>} */ {
      format: String,
      default: 'Digital Applications/TB25',
      nullable: true,
      env: 'SHAREPOINT_TB25_FOLDER_PATH'
    }
  }
})

config.validate({ allowed: 'strict' })

export { config }
