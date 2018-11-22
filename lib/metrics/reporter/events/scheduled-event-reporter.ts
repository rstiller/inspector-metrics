import { EventReporterBase } from "./event-reporter-base";
import { ScheduledEventReporterOptions } from "./scheduled-event-reporter-options";

export abstract class ScheduledEventReporter<O extends ScheduledEventReporterOptions> extends EventReporterBase<O> {

  private timer: NodeJS.Timer;

  public constructor(options: O) {
    super(options);
  }

  public start(): this {
    // const interval: number = this.options.unit.convertTo(this.options.reportInterval, MILLISECOND);
    // this.timer = this.options.scheduler(() => this.report(), interval);
    return this;
  }

  public stop(): this {
    if (this.timer) {
      this.timer.unref();
    }
    return this;
  }
}
