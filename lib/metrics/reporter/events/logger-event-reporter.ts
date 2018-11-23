import { Event } from "../../event";
import { IEventReporterOptions } from "./event-reporter-base";
import { MILLISECOND } from "../../time-unit";
import { Logger } from "../logger";
import { IEventPipeline } from "./event-pipeline";
import { RealtimeEventReporter } from "./realtime-event-reporter";
import { ScheduledEventReporter, IScheduledEventReporterOptions } from "./scheduled-event-reporter";

class LoggerEventPipeline<TEventData> implements IEventPipeline<TEventData, void> {
  constructor(private log: Logger) {
  }

  push(events: Event<TEventData>[]): Promise<void> {
    this.log.debug(events);
    return Promise.resolve();
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

export class RealtimeLoggerEventReporter<TEventData> extends RealtimeEventReporter<TEventData, void, IEventReporterOptions<TEventData, void>> {
  public constructor(log: Logger) {
    super({
      log: log,
      pipelineFactory: () => new LoggerEventPipeline(log)
    });
  }
}

export class ScheduledLoggerEventReporter<TEventData> extends ScheduledEventReporter<TEventData, void, IScheduledEventReporterOptions<TEventData, void>> {
  public constructor(log: Logger) {
    super({
      log: log,
      pipelineFactory: () => new LoggerEventPipeline(log),
      reportInterval: 10000,
      unit: MILLISECOND
    });
  }
}
