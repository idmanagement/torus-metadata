const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const redact = require("./redactSentry");

exports.registerSentry = (app) => {
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true, breadcrumbs: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({
          // to trace all requests to the default router
          app,
          // alternatively, you can specify the routes you want to trace:
          // router: someRouter,
        }),
        new Tracing.Integrations.Mysql(), // Add this integration
      ],
      tracesSampleRate: 0.01,
      sampleRate: 0.2,
      beforeSend(event) {
        return redact(event);
      },
    });
    app.use(
      Sentry.Handlers.requestHandler({
        request: ["public_address", "data", "headers", "method", "query_string", "url"],
      })
    );
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
};

exports.registerSentryErrorHandler = (app) => {
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    app.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          // Capture all 404 and 500 errors
          return error.status >= 400;
        },
      })
    );
  }
};
