# apha-apps-perms-case-mgmt-api

Case management service responsible for accepting submissions and making them accessible to the CSC. Additionally, it confirms the receipt of submission emails and sends corresponding notifications to clients.

- [apha-apps-perms-case-mgmt-api](#apha-apps-perms-case-mgmt-api)
  - [Requirements](#requirements)
    - [Node.js](#nodejs)
  - [Local development](#local-development)
    - [Setup](#setup)
    - [Development](#development)
      - [Environment variables required](#environment-variables-required)
    - [Testing](#testing)
    - [Production](#production)
    - [Npm scripts](#npm-scripts)
    - [Update dependencies](#update-dependencies)
    - [Formatting](#formatting)
      - [Windows prettier issue](#windows-prettier-issue)
  - [API endpoints](#api-endpoints)
  - [Development helpers](#development-helpers)
    - [MongoDB Locks](#mongodb-locks)
    - [Proxy](#proxy)
  - [Docker](#docker)
    - [Development image](#development-image)
    - [Production image](#production-image)
    - [Docker Compose](#docker-compose)
    - [Dependabot](#dependabot)
    - [SonarCloud](#sonarcloud)
  - [Licence](#licence)
    - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22` and [npm](https://nodejs.org/) `>= v11`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd apha-apps-perms-case-mgmt-api
nvm use
```

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

#### Environment variables required

| Environment Variable                                | Type    | Required value to run in local                                                                        | Description                                           |
| --------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `STUB_MODE_ENABLED`                                 | Boolean | true or false                                                                                         | Enables/disables stub mode for the API                |
| `NOTIFY_API_KEY`                                    | String  | [Value to be provided by tech team]                                                                   | API key for the Notify service                        |
| `NOTIFY_EMAIL_DOWNLOAD_CONFIRMATION`                | Boolean | true or false                                                                                         | Enables/disables email download confirmation          |
| `TB_NOTIFY_CASE_DELIVERY_EMAIL_ADDRESS`             | String  | an email that is in notify guest list                                                                 | Email address for TB case delivery notifications      |
| `TB_NOTIFY_APPLICANT_CONFIRMATION_TEMPLATE_ID`      | String  | ccd16b08-ce79-489b-8dc7-1d48986229d3                                                                  | Template ID for TB applicant confirmation emails      |
| `TB_NOTIFY_CASE_DELIVERY_TEMPLATE_ID`               | String  | 0aea83a0-82c1-4ec4-ada1-27db58b47812                                                                  | Template ID for TB case delivery emails               |
| `EXOTICS_NOTIFY_CASE_DELIVERY_EMAIL_ADDRESS`        | String  | an email that is in notify guest list                                                                 | Email address for Exotics case delivery notifications |
| `EXOTICS_NOTIFY_APPLICANT_CONFIRMATION_TEMPLATE_ID` | String  | ccd16b08-ce79-489b-8dc7-1d48986229d3                                                                  | Template ID for Exotics applicant confirmation emails |
| `EXOTICS_NOTIFY_CASE_DELIVERY_TEMPLATE_ID`          | String  | 0aea83a0-82c1-4ec4-ada1-27db58b47812                                                                  | Template ID for Exotics case delivery emails          |
| `AWS_REGION`                                        | String  | eu-west-2                                                                                             | AWS region for S3 file upload                         |
| `AWS_ACCESS_KEY_ID`                                 | String  | test                                                                                                  | AWS access key ID for S3 authentication               |
| `AWS_SECRET_ACCESS_KEY`                             | String  | test                                                                                                  | AWS secret access key for S3 authentication           |
| `S3_BUCKET`                                         | String  | apha                                                                                                  | S3 bucket name for file uploads                       |
| `GS_BINARY`                                         | String  | /usr/bin/gs                                                                                           | Path to Ghostscript binary                            |
| `SHAREPOINT_TB25_INTEGRATION_ENABLED`               | Boolean | true or false                                                                                         | Enables/disables SharePoint TB25 integration          |
| `SHAREPOINT_TB25_FOLDER_PATH`                       | String  | Digital Applications/TB25                                                                             | SharePoint folder path for TB25 documents             |
| `SHAREPOINT_TB25_TENANT_ID`                         | String  | 6f504113-6b64-43f2-ade9-242e05780007                                                                  | SharePoint tenant ID for TB25 integration             |
| `SHAREPOINT_TB25_CLIENT_ID`                         | String  | cfcf85b5-e70e-4adb-bae1-b274432d960d                                                                  | SharePoint client ID for TB25 integration             |
| `SHAREPOINT_TB25_CLIENT_SECRET`                     | String  | [Value to be provided by tech team]                                                                   | SharePoint client secret for TB25 integration         |
| `SHAREPOINT_TB25_SITE_ID`                           | String  | defradev.sharepoint.com%2C0f571f64-24e3-4e90-be4a-c9783309b888%2C23e0ce9e-2dd3-424d-b238-909907026576 | SharePoint site ID for TB25 integration               |
| `SHAREPOINT_TB25_LIST_ID`                           | String  | 74fdce34-80bd-4a8f-8a8f-02250ab1b2d7                                                                  | SharePoint list ID for TB25 documents                 |
| `SHAREPOINT_TB25_DRIVE_ID`                          | String  | b!ZB9XD-MkkE6-Ssl4Mwm4iJ7O4CPTLU1CsjiQmQcCZXZ30coF1EG3R7FxCg29jgyN                                    | SharePoint drive ID for TB25 documents                |
| `SHAREPOINT_TB25_SITE_NAME`                         | String  | APHAApplicationsPermissionsTestSite                                                                   | SharePoint site name for TB25 integration             |
| `SHAREPOINT_TB25_SITE_BASE_URL`                     | String  | https://defradev.sharepoint.com                                                                       | SharePoint base URL for TB25 integration              |
| `SQS_ENDPOINT`                                      | String  | https://sqs.eu-west-2.amazonaws.com                                                                   | AWS SQS endpoint URL for local development            |
| `SQS_QUEUE_URL`                                     | String  | https://sqs.eu-west-2.amazonaws.com/332499610595/apha_apps_perms_submitted_applications               | AWS SQS queue URL for submitted applications          |

### Testing

To test the application run:

```bash
npm run test
```

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## API endpoints

| Endpoint        | Description                                                                                                                                               |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET: /health`  | Health                                                                                                                                                    |
| `POST: /submit` | Endpoint that will generate an application reference, send emails to CSC case workers and to the applicant and return the generated application reference |

## Development helpers

### MongoDB Locks

If you require a write lock for Mongo you can acquire it via `server.locker` or `request.locker`:

```javascript
async function doStuff(server) {
  const lock = await server.locker.lock('unique-resource-name')

  if (!lock) {
    // Lock unavailable
    return
  }

  try {
    // do stuff
  } finally {
    await lock.free()
  }
}
```

Keep it small and atomic.

You may use **using** for the lock resource management.
Note test coverage reports do not like that syntax.

```javascript
async function doStuff(server) {
  await using lock = await server.locker.lock('unique-resource-name')

  if (!lock) {
    // Lock unavailable
    return
  }

  // do stuff

  // lock automatically released
}
```

Helper methods are also available in `/src/helpers/mongo-lock.js`.

### Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then
because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the
proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag apha-apps-perms-case-mgmt-api:development .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 apha-apps-perms-case-mgmt-api:development
```

### Production image

Build:

```bash
docker build --no-cache --tag apha-apps-perms-case-mgmt-api .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 apha-apps-perms-case-mgmt-api
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- MongoDB
- This service.
- A commented out frontend example.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

The project has been set up to run SonarCloud checks on every Pull Request. The configuration can be found in [sonar-project.properties](./sonar-project.properties)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
