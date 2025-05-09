import * as Sentry from '@sentry/nestjs';

const SENTRY_DSN =
  'https://0f2417f0812d2a50a8778dbcdf53535d@o4509270473244672.ingest.de.sentry.io/4509270621814864';

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
