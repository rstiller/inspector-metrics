import { Event } from "../../event";
import { IEventReporterOptions, EventReporterBase } from "./event-reporter-base";

export class RealtimeEventReporter<TEventData, TResult, TOptions extends IEventReporterOptions<TEventData, TResult>>  extends EventReporterBase<TEventData, TResult, TOptions> {

  public constructor(options: TOptions) {
    super(options);
  }

  protected doReport(event: Event<TEventData>): Promise<TResult> {
    if (!this.pipeline) {
      throw new Error("The reporter should be started before calling the report method");
    }
    else {
      return this.pipeline.push([event]);
    }
  }
}
