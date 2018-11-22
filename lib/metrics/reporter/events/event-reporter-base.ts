import { Event } from "../../event";
import { EventReporter } from "./event-reporter";
import { EventReporterOptions } from "./event-reporter-options";

export abstract class EventReporterBase<O extends EventReporterOptions> implements EventReporter {
  protected readonly options: O;

  public constructor(options: O) {
    this.options = options;
  }

  public report<T>(event: Event<T>): this {
    return this;
  }
}
