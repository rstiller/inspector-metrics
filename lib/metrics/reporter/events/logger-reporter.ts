import { Event } from "../../event";
import { MILLISECOND } from "../../time-unit";
import { Logger } from "../logger";
import { ScheduledEventReporter, ScheduledEventReporterOptions } from "./scheduled-event-reporter";

export interface LoggerReporterOptions extends ScheduledEventReporterOptions {
  logEvents?: (log: Logger) => (...args: any[]) => any;
}

export class LoggerReporter extends ScheduledEventReporter<LoggerReporterOptions> {
  constructor({
    log = console,
    reportInterval = 1000,
    unit = MILLISECOND,
    scheduler = setInterval,
    logEvents = (_) => _.debug,
  }: LoggerReporterOptions) {
    super({
      log,
      logEvents,
      reportInterval,
      scheduler,
      unit,
    });
  }

  protected async reportEvents(events: Array<Event<any>>): Promise<void> {
    this.options.logEvents(this.options.log)(events);
  }
}
