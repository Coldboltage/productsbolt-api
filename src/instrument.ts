// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://a01d361cdcaedb8569278d6dd1926b8a@o4506229796241408.ingest.us.sentry.io/4512441790562304',
  tracesSampleRate: 1.0,
});
