import { Event } from "../../event";
import { Logger } from "../logger";
import { IEventPipeline } from "./event-pipeline";
import { IEventReporter } from "./event-reporter";

export interface IEventReporterOptions<TEventData, TResult> {
  log: Logger;
  pipelineFactory: () => IEventPipeline<TEventData, TResult>;
}

export abstract class EventReporterBase<TEventData, TResult, TOptions extends IEventReporterOptions<TEventData, TResult>> implements IEventReporter<TEventData, TResult> {
  protected readonly options: TOptions;
  protected pipeline: IEventPipeline<TEventData, TResult> | null;

  public constructor(options: TOptions) {
    this.options = options;
  }

  public start(): this {
    if (this.pipeline) {
      throw new Error("The reporter has already been started");
    }

    this.pipeline = this.options.pipelineFactory();
    return this;
  }

  public stop(): Promise<void> {
    if (!this.pipeline) {
      throw new Error("The reporter has not been started yet");
    }

    return this.pipeline
      .flush()
      .then(() => {
        this.pipeline = null;
      })
      .catch((error) => {
        this.pipeline = null;
        throw error;
      });
  }

  public report(event: Event<TEventData>): Promise<TResult> {
    if (!this.pipeline) {
      throw new Error("The reporter should be started before calling the report method");
    }

    return this.doReport(event);
  }

  protected abstract doReport(event: Event<TEventData>): Promise<TResult>;
}
