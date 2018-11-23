import { Event } from "../../event";
import { IEventReporter } from "./event-reporter";
import { IEventPipeline } from "./event-pipeline";

export class ScheduledEventReporter<TEventData, TResult> implements IEventReporter<TEventData, TResult> {
  //  TODO should be in options
  private pipelineFactory: () => IEventPipeline<TEventData, TResult>;
  private pipeline: IEventPipeline<TEventData, TResult>;
  private buffer = new Array<Event<TEventData>>();
  private promise: Promise<TResult>;

  constructor(pipelineFactory: () => IEventPipeline<TEventData, TResult>) {
    this.pipelineFactory = pipelineFactory;
  }

  private armTimeout(): void {
    const pipeline = this.pipeline;

    this.promise = new Promise<TResult>((resolve, reject) => {
      setTimeout(() => {
        const buffer = this.buffer;
        this.buffer = new Array<Event<TEventData>>();
        pipeline.push(buffer)
          .then(result => resolve(result))
          .catch(error => reject(error));
        this.armTimeout();
      },
        10000
      );
    });
  }

  public start(): this {
    if (this.pipeline) {
      throw new Error("The reporter has already been started");
    }
    else {
      this.pipeline = this.pipelineFactory();
      this.armTimeout();
    }

    return this;
  }


  public stop(): Promise<void> {
    if (!this.pipeline) {
      throw new Error("The reporter has not been started yet");
    }
    else {
      return this.pipeline
        .flush()
        .then(() => {
          this.pipeline = null;
        })
        .catch(error => {
          this.pipeline = null;
          throw error;
        });
    }
  }

  public report(event: Event<TEventData>): Promise<TResult> {
    if (!this.pipeline) {
      throw new Error("The reporter should be started before calling the report method");
    }
    else {
      this.buffer.push(event);
      return this.promise;
    }
  }
}


// import { Event } from "../../event";
// import { MILLISECOND, TimeUnit } from "../../time-unit";
// import { Scheduler } from "../scheduler";
// import { IEventReporter } from "./event-reporter";
// import { EventReporterBase, IEventReporterOptions } from "./event-reporter-base";

// export interface IScheduledEventReporterOptions extends IEventReporterOptions {
//   readonly reportInterval?: number;
//   readonly unit?: TimeUnit;
//   readonly scheduler?: Scheduler;
// }

// export abstract class ScheduledEventReporter<TOptions extends IScheduledEventReporterOptions, TEventData, TResult>
//   extends EventReporterBase<TOptions>
//   implements IEventReporter<TEventData, TResult> {

//   private timer: NodeJS.Timer;
//   // TODO event template type
//   private events = new Array<Event<any>>();

//   public constructor(options: TOptions) {
//     super(options);
//   }

//   public start(): this {
//     const interval: number = this.options.unit.convertTo(this.options.reportInterval, MILLISECOND);
//     this.timer = this.options.scheduler(() => this.doReport(), interval);
//     return this;
//   }

//   public stop(): this {
//     if (this.timer) {
//       this.timer.unref();
//     }
//     // flush buffer if there are some events remaining
//     // TODO : doReport is async, there is a risk to loose some events if we don't wait the operation to finsh
//     this.doReport();
//     return this;
//   }

//   public report(event: Event<TEventData>): Promise<TResult> {
//     this.events.push(event);
//     return Promise.resolve(undefined);
//   }

//   protected abstract async reportEvents(events: Array<Event<any>>): Promise<void>;

//   private async doReport(): Promise<void> {
//     if (this.events.length) {
//       // reset events buffer
//       const events = this.events;
//       this.events = new Array<Event<any>>();
//       return this.reportEvents(events);
//     }
//   }
// }
