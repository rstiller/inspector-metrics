import { Event } from "../../event";
import { MILLISECOND } from "../../time-unit";
import { EventReporter } from "./event-reporter";
import { EventReporterBase } from "./event-reporter-base";
import { ScheduledEventReporterOptions } from "./scheduled-event-reporter-options";

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
    const options = this.getOptions();
    const interval: number = options.unit.convertTo(options.reportInterval, MILLISECOND);
    this.timer = options.scheduler(() => this.doReport(), interval);
    return this;
  }

  public stop(): this {
    if (this.timer) {
      this.timer.unref();
    }
    return this;
  }

  public report<T>(event: Event<T>): this {
    this.events.push(event);
    return this;
  }

  protected abstract async reportEvents(events: Array<Event<any>>): Promise<any>;

  private doReport(): Promise<any> {
    // reset events buffer
    const events = this.events;
    this.events = new Array<Event<any>>();
    return this.reportEvents(events);
  }
}
