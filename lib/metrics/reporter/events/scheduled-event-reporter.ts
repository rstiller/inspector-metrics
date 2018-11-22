import { Event } from "../../event";
import { MILLISECOND, TimeUnit } from "../../time-unit";
import { Scheduler } from "../scheduler";
import { EventReporter } from "./event-reporter";
import { EventReporterBase, EventReporterOptions } from "./event-reporter-base";

export interface ScheduledEventReporterOptions extends EventReporterOptions {
  readonly reportInterval?: number;
  readonly unit?: TimeUnit;
  readonly scheduler?: Scheduler;
}

export abstract class ScheduledEventReporter<O extends ScheduledEventReporterOptions>
  extends EventReporterBase<O>
  implements EventReporter {

  private timer: NodeJS.Timer;
  // TODO event template type
  private events = new Array<Event<any>>();

  public constructor(options: O) {
    super(options);
  }

  public start(): this {
    const interval: number = this.options.unit.convertTo(this.options.reportInterval, MILLISECOND);
    this.timer = this.options.scheduler(() => this.doReport(), interval);
    return this;
  }

  public stop(): this {
    if (this.timer) {
      this.timer.unref();
    }
    // flush buffer if there are some events remaining
    // TODO : doReport is async, there is a risk to loose some events if we don't wait the operation to finsh
    this.doReport();
    return this;
  }

  public report<T>(event: Event<T>): this {
    this.events.push(event);
    return this;
  }

  protected abstract async reportEvents(events: Array<Event<any>>): Promise<void>;

  private async doReport(): Promise<void> {
    if (this.events.length) {
      // reset events buffer
      const events = this.events;
      this.events = new Array<Event<any>>();
      return this.reportEvents(events);
    }
  }
}
