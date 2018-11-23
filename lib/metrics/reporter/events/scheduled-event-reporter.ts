import { Event } from "../../event";
import { IEventReporter } from "./event-reporter";
import { IEventReporterOptions, EventReporterBase } from "./event-reporter-base";
import { TimeUnit, MILLISECOND } from "../../time-unit";

class EventBatch<TIn, TOut> {
  private buffer = new Array<Event<TIn>>();
  private promise: Promise<TOut>;

  constructor(handler: (events: Array<Event<TIn>>) => Promise<TOut>, interval: number) {
    this.promise = new Promise<TOut>((resolve, reject) => {
      setTimeout(() => {
        const inner = handler(this.buffer);
        inner
          .then(result => resolve(result))
          .catch(error => reject(error));
      }, interval);
    });
  }

  push(events: Event<TIn>[]): Promise<TOut> {
    events.forEach(_ => this.buffer.push(_));
    return this.promise;
  }

  flush(): Promise<void> {
    return this.promise.then(() => { });
  }
}

export interface IScheduledEventReporterOptions<TEventData, TResult> extends IEventReporterOptions<TEventData, TResult> {
  readonly reportInterval: number;
  readonly unit: TimeUnit;
}

export class ScheduledEventReporter<TEventData, TResult, TOptions extends IScheduledEventReporterOptions<TEventData, TResult>>
  extends EventReporterBase<TEventData, TResult, TOptions>
  implements IEventReporter<TEventData, TResult> {

  private batch: EventBatch<TEventData, TResult>;

  public constructor(options: TOptions) {
    super(options);
  }

  protected doReport(event: Event<TEventData>): Promise<TResult> {
    if (!this.batch) {
      this.createBatch();
    }
    return this.batch.push([event]);
  }

  private createBatch(): void {
    const interval = this.options.unit.convertTo(this.options.reportInterval, MILLISECOND);

    this.batch = new EventBatch<TEventData, TResult>(buffer => {
      //  reset current bactch
      this.batch = null;
      return this.pipeline.push(buffer);
    }, interval);
  }
}
