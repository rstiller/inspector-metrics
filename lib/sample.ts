import "source-map-support/register";

import { Event } from "./metrics/event";
import { ScheduledEventReporter } from "./metrics/reporter/events/scheduled-event-reporter";
import { ScheduledEventReporterOptions } from "./metrics/reporter/events/scheduled-event-reporter-options";
// import { NullLogger } from "./metrics/reporter/null-logger";
import { MILLISECOND } from "./metrics/time-unit";
import { Logger } from "./metrics/reporter/logger";

export interface LoggerReporterOptions extends ScheduledEventReporterOptions {
  logEvents?: (log: Logger) => (...args: any[]) => any
}

export class LoggerReporter extends ScheduledEventReporter<LoggerReporterOptions> {
  constructor({
    log = console,
    reportInterval = 1000,
    unit = MILLISECOND,
    scheduler = setInterval,
    logEvents = (log) => log.debug,
  }: LoggerReporterOptions) {
    super({
      log,
      reportInterval,
      unit,
      scheduler,
      logEvents,
    });
  }

  protected async reportEvents(events: Array<Event<any>>): Promise<void> {
    this.options.logEvents(this.options.log)(events);
  }
}

const reporter = new LoggerReporter({});

reporter.start();

reporter.report(new Event<string>("test"));

reporter.stop();
