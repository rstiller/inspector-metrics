import { TimeUnit } from "../../time-unit";
import { Scheduler } from "../scheduler";
import { EventReporterOptions } from "./event-reporter-options";

export interface ScheduledEventReporterOptions extends EventReporterOptions {
  readonly reportInterval?: number;
  readonly unit?: TimeUnit;
  readonly scheduler?: Scheduler;
}
