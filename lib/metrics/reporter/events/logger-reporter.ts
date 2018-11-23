// import { Event } from "../../event";
// import { MILLISECOND } from "../../time-unit";
// import { Logger } from "../logger";
// import { IScheduledEventReporterOptions, ScheduledEventReporter } from "./scheduled-event-reporter";

// export interface ILoggerReporterOptions extends IScheduledEventReporterOptions {
//   logEvents?: (log: Logger) => (...args: any[]) => any;
// }

// export class LoggerReporter<TEventData, TResult> extends ScheduledEventReporter<ILoggerReporterOptions, TEventData, TResult> {
//   constructor({
//     log = console,
//     reportInterval = 1000,
//     unit = MILLISECOND,
//     scheduler = setInterval,
//     logEvents = (_) => _.debug,
//   }: ILoggerReporterOptions) {
//     super({
//       log,
//       logEvents,
//       reportInterval,
//       scheduler,
//       unit,
//     });
//   }

//   protected async reportEvents(events: Array<Event<TEventData>>): Promise<void> {
//     this.options.logEvents(this.options.log)(events);
//   }
// }
