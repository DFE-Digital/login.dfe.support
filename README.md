# DfE Support Console

**DfE Support Console** enables support staff to manage and respond to requests from users and approvers, supporting the day-to-day operation of the DfE Sign-in platform. This service is part of the wider **login.dfe** project.

## Environment Configuration

### Development prerequisites

Before setting up your local environment, review the [Development Prerequisites documentation](https://dfe-secureaccess.atlassian.net/wiki/spaces/NSA/pages/4643454992/Development+prerequisites) available on confluence. This guide outlines the required tools, dependencies, and permissions needed to work on DfE Sign-in services.

### Local environment

To set up your local environment, run the PowerShell tokenization script provided in the **login.dfe.dsi-config** repository.  
This script generates the environment variables required to connect to the **DfE Sign-in (Dev)** environment.

**Steps**

1. Clone or navigate to the `login.dfe.dsi-config` repository.
2. Run the PowerShell tokenization script provided in that repository.
3. The script will create or update the necessary configuration files (e.g. `.env`) for this service.
4. Ensure that the generated `.env` file is placed in the **root directory** of this project.

Once completed, your local environment will be configured to connect to the DfE Sign-in dev environment.

## Getting Started

Install deps

```
npm install
```

### Run application

This application requires redis to run. If running locally, the easiest way is to create an instance of redis using docker:

```
docker run -d -p 6379:6379 redis
```

Once redis is running, start it with:

```
npm run dev
```

Once the application has started, you can view it in the browser by going to:

```
https://localhost:41020/
```

### Run tests

```
npm run test
```
