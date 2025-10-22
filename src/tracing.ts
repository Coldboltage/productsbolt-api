// Start OpenTelemetry BEFORE Nest boots.

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { TypeormInstrumentation } from '@opentelemetry/instrumentation-typeorm';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'productsbolt-api',
  'service.version': process.env.APP_VERSION ?? 'dev',
  'deployment.environment': process.env.NODE_ENV ?? 'dev',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
      'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': { enabled: false }, // <- turn off middleware spans
      '@opentelemetry/instrumentation-pg': { enabled: false }, // keep if you pr
    }),
    new NestInstrumentation(),
    new TypeormInstrumentation({ suppressInternalInstrumentation: true }),
  ],
});

sdk.start();
console.log('Tracing initialized');
process.on('SIGINT', () => sdk.shutdown().finally(() => process.exit(0)));
process.on('SIGTERM', () => sdk.shutdown().finally(() => process.exit(0)));
