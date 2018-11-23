import { Event } from "../../event";
import { IEventReporter } from "./event-reporter";
import { IEventPipeline } from "./event-pipeline";

export class RealtimeEventReporter<TEventData, TResult> implements IEventReporter<TEventData, TResult> {
  //  TODO should be in options
  private pipelineFactory: () => IEventPipeline<TEventData, TResult>;
  private pipeline: IEventPipeline<TEventData, TResult>;

  constructor(pipelineFactory: () => IEventPipeline<TEventData, TResult>) {
    this.pipelineFactory = pipelineFactory;
  }

  public start(): this {
    if (this.pipeline) {
      throw new Error("The reporter has already been started");
    }
    else {
      this.pipeline = this.pipelineFactory();
      return this;
    }
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
      return this.pipeline.push([event]);
    }
  }
}
// import { Event } from "../../event";
// import { IEventReporter } from "./event-reporter";
// import { EventReporterBase, IEventReporterOptions } from "./event-reporter-base";

// export interface IRealtimeEventReporterOptions extends IEventReporterOptions {
// }

// export abstract class RealtimeEventReporter<TOptions extends IRealtimeEventReporterOptions, TEventData, TResult>
//   extends EventReporterBase<TOptions>
//   implements IEventReporter<TEventData, TResult> {

//   public constructor(options: TOptions) {
//     super(options);
//   }

//   public abstract start(): this;

//   public abstract stop(): this;

//   public abstract report(event: Event<TEventData>): Promise<TResult>;
// }
