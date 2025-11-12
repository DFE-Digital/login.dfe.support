# DfE Sign-in Support

**DfE Sign-in Support** provides a console that allows staff to manage and respond to requests from users and approvers, supporting the day-to-day operation of the DfE Sign-in platform. This service is part of the wider **login.dfe** project.

## Getting Started

### Install Dependencies

```
npm install
```

Additionally, this app requires Redis as a backing service. The easiest way is to create an instance of Redis using Docker:

```
docker run -d -p 6379:6379 redis
```

### Run application

Start the application with:

```
npm run dev
```

Once the application has started, you can view it in the browser by going to:

```
https://localhost:41020
```

### Run Tests

Run all tests with:

```
npm run test
```

### Code Quality and Formatting

Run ESLint:

```
npm run lint
```

Automatically fix lint issues:

```
npm run lint:fix
```

### Development Checks

Run linting and tests together:

```
npm run dev:checks
```

### Pre-commit Hooks

Pre-commit hooks are handled automatically via Husky. No additional setup is required.
