import * as express from 'express';

import { Event } from "./metrics/event";

// import { RealtimeLoggerEventReporter } from "./metrics/reporter/events/logger-event-reporter";

// const reporter = new RealtimeLoggerEventReporter(console);

import { ScheduledLoggerEventReporter } from "./metrics/reporter/events/logger-event-reporter";

const reporter = new ScheduledLoggerEventReporter(console);

reporter.start();

const app = express();

function middleware(req: express.Request, res: express.Response, next: express.NextFunction): any {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const event = new Event('request').setValue({duration});

    reporter.report(event).then(() => console.log("reported !"));
  });

  return next();
}

app.use(middleware);

app.get('/hello', (req: express.Request, res: express.Response) => {
  res.send('hello');
});

app.listen(9100, function () {
  console.log('Listening on port 9100')
});
